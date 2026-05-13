import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../layout";

export default function GuideProductionPage() {
  return (
    <GuidePage
      title="Mettre en production"
      description="Checklist complète pour passer du dev au déploiement réel."
    >
      <Callout type="info">
        Ce guide suppose que tu déploies sur <strong>Vercel</strong> avec ton propre projet
        Supabase. Tous les autres hébergeurs Node fonctionnent (Render, Fly, Railway) mais
        certaines instructions Vercel-spécifiques ne s'appliqueront pas.
      </Callout>

      <GuideSection title="1 · Appliquer les migrations Supabase">
        <p>
          L'app utilise 9 migrations SQL qui définissent toutes les tables et politiques de
          sécurité. À chaque nouveau projet Supabase, il faut les exécuter une fois.
        </p>
        <Steps>
          <Step number={1} title="Générer le bundle">
            Depuis ton terminal dans le dossier du projet :
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">npm run db:bundle</pre>
            Ça crée <code>supabase/migrations/_all.sql</code> (toutes les migrations concaténées).
          </Step>
          <Step number={2} title="Coller dans Supabase">
            Ouvre Supabase → <Path>SQL Editor → New query</Path> → ouvre <code>_all.sql</code>,
            sélectionne tout (Ctrl+A), copie, colle dans l'éditeur, clique <strong>Run</strong>.
          </Step>
          <Step number={3} title="Vérifier les tables">
            Va dans <Path>Table Editor</Path>. Tu dois voir : <code>employees</code>, <code>reminders</code>,
            <code> profiles</code>, <code>categories</code>, <code>sessions</code>, <code>feed_items</code>,
            <code> teams</code>, <code>schedule_runs</code>, etc.
          </Step>
        </Steps>
        <Callout type="tip">
          Les migrations sont <strong>idempotentes</strong> (CREATE IF NOT EXISTS) — tu peux les
          relancer sans casser ce qui existe déjà.
        </Callout>
      </GuideSection>

      <GuideSection title="2 · Configurer Supabase Auth pour la prod">
        <Steps>
          <Step number={1} title="Site URL">
            Dans Supabase → <Path>Authentication → URL Configuration → Site URL</Path>, mets
            ton URL de production (ex: <code>https://ton-domaine.com</code>).
          </Step>
          <Step number={2} title="Redirect URLs">
            Ajouter <code>https://ton-domaine.com/auth/callback</code> dans la liste blanche.
            Sans ça, les emails de confirmation et resets pointeront vers localhost.
          </Step>
          <Step number={3} title="Activer la confirmation d'email (recommandé)">
            <Path>Authentication → Providers → Email → Confirm email</Path> → <strong>ON</strong>.
            En dev tu peux le laisser OFF pour aller plus vite, mais en prod active-le pour
            éviter les inscriptions avec des emails bidons.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="3 · Brancher un vrai provider email (Resend)">
        <p>
          Par défaut, l'app utilise un provider <em>mock</em> qui n'envoie rien. Pour des envois
          réels, le plus simple est <strong>Resend</strong> (gratuit jusqu'à 3 000 emails/mois).
        </p>
        <Steps>
          <Step number={1} title="Créer un compte Resend">
            <a
              href="https://resend.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:underline"
            >
              resend.com
            </a>{" "}
            → inscris-toi.
          </Step>
          <Step number={2} title="Vérifier ton domaine">
            <Path>Domains → Add domain</Path>. Resend te donne 3-4 enregistrements DNS à ajouter
            chez ton registrar (OVH, Namecheap, Cloudflare…). Sinon, pour tester rapidement, tu
            peux envoyer depuis l'adresse <code>onboarding@resend.dev</code>.
          </Step>
          <Step number={3} title="Créer une clé API">
            <Path>API Keys → Create API Key</Path> → copie la clé.
          </Step>
          <Step number={4} title="Ajouter dans Vercel">
            Dans Vercel → <Path>Settings → Environment Variables</Path> :
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">{`EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@ton-domaine.com
RESEND_API_KEY=re_xxxxxxxxxxxx`}</pre>
          </Step>
          <Step number={5} title="Redéployer">
            Vercel relance avec les nouvelles vars d'env. Les prochains envois passeront par Resend.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="4 · Brancher Twilio (SMS, optionnel)">
        <p>
          Même principe que Resend, pour les SMS. Twilio facture ~0,08 € par SMS en France.
        </p>
        <Steps>
          <Step number={1} title="Compte Twilio + numéro">
            <a
              href="https://www.twilio.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:underline"
            >
              twilio.com
            </a>{" "}
            → inscris-toi → achète un numéro (crédit d'essai gratuit).
          </Step>
          <Step number={2} title="Récupérer Account SID + Auth Token">
            Dans la console Twilio.
          </Step>
          <Step number={3} title="Vercel env vars">
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">{`SMS_PROVIDER=twilio
SMS_FROM=+33xxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx`}</pre>
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="5 · Cron pour les planifications">
        <p>
          L'endpoint <code>/api/cron/run-schedules</code> exécute les planifications récurrentes
          ET les rappels en un seul appel. Il doit tourner régulièrement.
        </p>

        <Callout type="info">
          <strong>Vercel Hobby</strong> (plan gratuit) ne permet que <strong>2 crons max</strong>,
          et seulement des <strong>schedules quotidiens</strong> (1 fois/jour). L'app est déjà
          configurée pour fonctionner dans cette limite. Mais pour des planifications
          fréquentes (toutes les heures, toutes les minutes), tu dois ajouter un
          <strong> cron externe gratuit</strong> (voir ci-dessous).
        </Callout>

        <p className="font-semibold">Option A — Vercel Cron seul (plan Hobby)</p>
        <p>
          Déjà configuré dans <code>vercel.json</code> : le worker tourne 1 fois par jour à 7h UTC.
          Suffisant si tes planifications sont quotidiennes.
        </p>

        <p className="font-semibold mt-4">Option B — Cron externe pour des envois fréquents (recommandé)</p>
        <p>
          Utilise <strong>cron-job.org</strong> (gratuit, illimité) pour appeler l'endpoint
          plus souvent :
        </p>
        <Steps>
          <Step number={1} title="Créer un compte sur cron-job.org">
            <a
              href="https://cron-job.org"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:underline"
            >
              cron-job.org
            </a>{" "}
            → inscris-toi (gratuit).
          </Step>
          <Step number={2} title="Créer un cron job">
            <ul className="ml-5 list-disc space-y-1 mt-1">
              <li><strong>URL</strong> : <code>https://ton-domaine.com/api/cron/run-schedules</code></li>
              <li><strong>Méthode</strong> : POST (ou GET)</li>
              <li><strong>Schedule</strong> : toutes les minutes, toutes les 5 min, ou toutes les heures selon ton besoin</li>
              <li><strong>Header</strong> : ajouter <code>Authorization: Bearer TON_CRON_SECRET</code></li>
            </ul>
          </Step>
          <Step number={3} title="Générer un CRON_SECRET">
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">openssl rand -hex 32</pre>
            Copie le résultat.
          </Step>
          <Step number={4} title="Mettre dans Vercel">
            <Path>Settings → Environment Variables</Path> → ajouter <code>CRON_SECRET</code> avec la valeur générée.
          </Step>
          <Step number={5} title="Tester">
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">{`curl -X POST https://ton-domaine.com/api/cron/run-schedules \\
  -H "Authorization: Bearer $CRON_SECRET"`}</pre>
            Tu dois recevoir <code>{`{ "ok": true, "schedules": ..., "reminders": ... }`}</code>.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="6 · Variables d'environnement requises">
        <p>Récapitulatif de toutes les variables à mettre dans Vercel :</p>
        <pre className="overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">{`# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron (obligatoire si tu utilises les planifications)
CRON_SECRET=<générer avec openssl rand -hex 32>

# Email (optionnel mais nécessaire pour de vrais envois)
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@ton-domaine.com
RESEND_API_KEY=re_xxxxx

# SMS (optionnel)
SMS_PROVIDER=twilio
SMS_FROM=+33xxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

# Monitoring (optionnel)
ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/xxx`}</pre>
      </GuideSection>

      <GuideSection title="7 · Monitoring des erreurs">
        <p>
          L'app reporte automatiquement les erreurs runtime côté serveur ET côté client
          dans les logs Vercel. Pour recevoir en plus une notification quand une erreur
          se produit :
        </p>
        <Steps>
          <Step number={1} title="Crée un webhook Discord ou Slack">
            Sur Discord : Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → copier l'URL.
            Sur Slack : <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">api.slack.com/messaging/webhooks</a>.
          </Step>
          <Step number={2} title="Variable d'env">
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs">ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/xxx</pre>
          </Step>
          <Step number={3} title="Test">
            Visite une page qui plante volontairement. L'erreur arrive dans ton canal.
          </Step>
        </Steps>
        <Callout type="info">
          Pour quelque chose de plus pro (regrouper, retracer, dashboards), tu peux pointer
          <code> ERROR_WEBHOOK_URL</code> vers Axiom, Logsnag, ou un endpoint Sentry HTTP.
          Aucun changement de code requis — c'est juste une URL différente.
        </Callout>
      </GuideSection>

      <GuideSection title="8 · Vérifier que tout marche">
        <p>5 vérifications rapides après le déploiement :</p>
        <Steps>
          <Step number={1} title="Health check">
            <code>GET https://ton-domaine.com/api/health</code> → doit retourner{" "}
            <code>{`{ "status": "ok" }`}</code>.
          </Step>
          <Step number={2} title="Signup">
            Crée un compte test. Tu reçois l'email de confirmation. Tu cliques le lien → tu es connecté.
          </Step>
          <Step number={3} title="Notification">
            Crée une notification, puis ouvre une session privée et inscris-toi avec un autre email.
            La notif apparaît dans son fil.
          </Step>
          <Step number={4} title="Cron">
            Crée une planification avec une heure dans 2 minutes. Attends. Une notification
            apparaît automatiquement dans le fil à l'heure prévue.
          </Step>
          <Step number={5} title="Logs">
            Vercel → ton projet → <Path>Logs</Path>. Tu vois les requêtes et les éventuelles
            erreurs. Filtre par "error" pour ne voir que les problèmes.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="9 · Empêcher Supabase de se mettre en veille">
        <p>
          <strong>Supabase free tier</strong> met le projet en pause après{" "}
          <strong>7 jours sans activité</strong>. Au réveil suivant, la première requête prend
          quelques secondes, et tu peux même perdre temporairement l'accès. L'app inclut un
          endpoint dédié <code>/api/cron/keep-alive</code> qui fait une requête minimale chaque
          jour pour maintenir le projet actif.
        </p>

        <Callout type="info">
          Sur Vercel, l'endpoint est déjà programmé dans <code>vercel.json</code> pour tourner
          tous les jours à 6h UTC. Tu n'as <strong>rien à faire</strong> si tu déploies sur Vercel.
        </Callout>

        <p>
          Si tu n'es pas sur Vercel ou que le plan Vercel Hobby limite tes crons, configure un
          service externe gratuit qui hit <code>/api/cron/keep-alive</code> en GET une fois par
          jour. Options :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>cron-job.org</strong> (gratuit, illimité) — crée un job qui GET sur
            <code> https://ton-domaine.com/api/cron/keep-alive</code>, schedule daily.
          </li>
          <li>
            <strong>UptimeRobot</strong> (gratuit pour 50 monitors) — fait un monitor HTTP qui
            check toutes les 5 minutes. Bonus : tu reçois un email si le site tombe.
          </li>
          <li>
            <strong>GitHub Actions</strong> — workflow cron schedule qui curl l'URL. Gratuit
            pour repos publics.
          </li>
        </ul>

        <Callout type="tip">
          L'endpoint est <strong>public</strong> (pas besoin de secret). C'est volontaire : aucune
          donnée sensible n'est exposée et n'importe quel cron externe peut le hit directement.
          La requête fait juste un SELECT count sur <code>app_settings</code> — quelques octets.
        </Callout>

        <p>
          Pour vérifier que ça marche : visite <code>https://ton-domaine.com/api/cron/keep-alive</code>
          dans ton navigateur. Tu dois voir{" "}
          <code>{`{ "status": "alive", "durationMs": 42, ... }`}</code>.
        </p>
      </GuideSection>

      <GuideSection title="Rate limiting & sécurité">
        <Callout type="info">
          <p className="mb-2">
            <strong>Supabase Auth gère déjà le rate limiting</strong> sur signup et login
            (anti-bruteforce, anti-bot). Configurable dans
            <Path>Authentication → Rate Limits</Path>.
          </p>
          <p>
            Si tu attends beaucoup de trafic public (page d'accueil, /api/health), envisage
            Vercel WAF (Pro) ou Cloudflare devant.
          </p>
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/production" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
