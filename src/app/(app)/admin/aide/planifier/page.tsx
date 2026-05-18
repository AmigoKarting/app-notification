import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideSchedulePage() {
  return (
    <GuidePage
      title="Planifier des envois récurrents"
      description="Comment automatiser une notification qui se répète."
    >
      <GuideSection title="C'est quoi une planification ?">
        <p>
          Une planification est une recette qui dit : <em>« envoyer ce message tous les X jours, à telle heure »</em>.
          À chaque tir, elle génère automatiquement une notification que les destinataires voient.
        </p>
        <p>
          Exemple : « Café du matin — tous les jours sauf weekend, à 9h00 ».
        </p>
      </GuideSection>

      <GuideSection title="Créer ta première planification">
        <Steps>
          <Step number={1} title="Va sur Planifications">
            Sidebar gauche → <Path>Planifications</Path> → bouton « Nouvelle ».
          </Step>
          <Step number={2} title="Titre + Message">
            Le contenu qui sera envoyé à chaque tir.
          </Step>
          <Step number={3} title="Choisis les heures">
            Au moins une. Bouton <strong>« + Ajouter une heure »</strong> pour en mettre plusieurs (ex: 09:00 et 14:00 pour 2 tirs par jour).
          </Step>
          <Step number={4} title="Choisis les jours">
            Clique sur L M M J V S D. Raccourcis : <em>Semaine</em> (L à V) ou <em>Tous les jours</em>.
          </Step>
          <Step number={5} title="Choisis les destinataires">
            Pareil que pour une notification : tout le monde / équipes / personnes.
          </Step>
          <Step number={6} title="Vérifie l'aperçu">
            Sous les jours, tu vois « Prochain envoi : … ». Si ça correspond à ce que tu veux, c'est bon.
          </Step>
          <Step number={7} title="Clique « Créer »">
            La planification est active immédiatement. Le premier envoi se fera à l'heure prévue.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Mettre en pause / réactiver">
        <p>
          Dans la liste <Path>Planifications</Path>, chaque ligne a un badge <em>Actif</em> ou <em>Pause</em> cliquable :
          un clic suffit pour basculer.
        </p>
        <p>
          Quand une planification est en pause :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>aucun nouveau message n'est envoyé,</li>
          <li>les messages déjà envoyés restent visibles dans le fil,</li>
          <li>la réactivation reprend les envois à la prochaine occurrence prévue.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Fuseau horaire">
        <p>
          Toutes les heures sont interprétées dans le <strong>fuseau</strong> choisi (par défaut Europe/Paris).
          Si tu mets <em>09:00 — Europe/Paris</em>, ça partira à 9h heure de Paris, peu importe où le serveur tourne.
        </p>
        <Callout type="info">
          Le calcul gère automatiquement les changements d'heure (heure d'été / d'hiver). Pas besoin de t'en soucier.
        </Callout>
      </GuideSection>

      <GuideSection title="Période (session) liée à la planification">
        <p>
          Tu peux rattacher la planification à une <strong>session</strong> dans la section <em>Classement</em>.
          Si tu désactives cette session, <strong>la planification cesse d'envoyer</strong> automatiquement.
          Quand tu la réactives, l'envoi reprend.
        </p>
        <Callout type="tip">
          Utile pour des campagnes saisonnières — par exemple « Notifications Été 2026 » que tu coupes en septembre
          sans devoir mettre toutes tes planifications en pause individuellement.
        </Callout>
      </GuideSection>

      <GuideSection title="Pas de doublons possible">
        <p>
          Même si le worker tourne deux fois en parallèle (Vercel Cron + service externe par exemple), chaque
          occurrence ne peut être créée qu'<strong>une seule fois</strong>. C'est garanti côté base de données.
        </p>
      </GuideSection>

      <GuideSection title="Différence avec une notification ponctuelle programmée">
        <p>
          Sur une notification (page Notifications), tu peux mettre « Publier le… » à une date future.
          C'est <strong>ponctuel</strong> : ça part une seule fois.
        </p>
        <p>
          Sur une planification (page Planifications), tu choisis des heures + jours : ça part <strong>à
          chaque occurrence</strong> qui correspond, jusqu'à ce que tu la mettes en pause.
        </p>
      </GuideSection>

      <GuideNav current="/admin/aide/planifier" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
