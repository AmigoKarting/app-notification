import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../layout";

export default function GuideUsersPage() {
  return (
    <GuidePage
      title="Utilisateurs et rôles"
      description="Comprendre les 2 rôles et gérer qui peut faire quoi."
    >
      <GuideSection title="Les 2 rôles">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Employé</strong> — accès en lecture seule au fil de notifications du jour. Pas d'accès à l'admin.
          </li>
          <li>
            <strong>Dev (admin)</strong> — voit le fil + peut configurer toute l'app : notifications, planifications,
            catégories, sessions, équipes, utilisateurs, marque.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Comment quelqu'un devient dev">
        <p>3 façons, dans l'ordre logique :</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Le tout premier compte</strong> créé sur ton installation devient automatiquement dev.
            (Sinon tu ne pourrais jamais accéder à l'admin.)
          </li>
          <li>
            <strong>Promotion par un dev</strong> existant. Tu vas sur <Path>Admin → Utilisateurs</Path>, tu
            trouves la personne et tu cliques <strong>« Promouvoir dev »</strong>.
          </li>
          <li>
            <strong>Rétrogradation</strong> — bouton « Rétrograder employé » sur la même ligne pour faire l'inverse.
            Tu ne peux pas te rétrograder toi-même (sécurité anti-blocage).
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Promouvoir quelqu'un">
        <Steps>
          <Step number={1} title="La personne crée son compte">
            Sur la page d'accueil, elle s'inscrit avec son email. Par défaut, elle est employée.
          </Step>
          <Step number={2} title="Toi (dev), va sur Admin → Utilisateurs">
            Tu vois la liste de tous les comptes. Le sien apparaît avec le badge « employee ».
          </Step>
          <Step number={3} title="Clique « Promouvoir dev »">
            Le rôle bascule immédiatement.
          </Step>
          <Step number={4} title="Elle recharge sa session">
            À sa prochaine connexion (ou rechargement), elle voit le bouton Admin et a accès à toute l'administration.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Ce qu'un employé peut faire">
        <ul className="ml-5 list-disc space-y-1">
          <li>Voir les notifications publiées qui le ciblent (tout le monde / son équipe / lui).</li>
          <li>Modifier son propre nom affiché et la couleur d'accent.</li>
          <li>Se déconnecter.</li>
        </ul>
        <p>
          C'est tout. Les pages admin sont protégées côté base de données (RLS) — même un employé qui essaie d'accéder
          à <Path>/admin</Path> est redirigé vers son fil.
        </p>
      </GuideSection>

      <GuideSection title="Ce qu'un dev peut faire en plus">
        <ul className="ml-5 list-disc space-y-1">
          <li>Tout l'admin (créer / modifier / supprimer notifications, planifications, catégories, sessions, équipes).</li>
          <li>Promouvoir/rétrograder d'autres utilisateurs.</li>
          <li>Voir l'audit des envois multi-canaux.</li>
          <li>Personnaliser la marque (logo, nom, tagline).</li>
        </ul>
        <Callout type="info">
          Chaque dev voit uniquement <strong>ses propres</strong> catégories, sessions, équipes, planifications.
          Deux devs sur la même installation ont des workspaces séparés.
          Les notifications publiées sont, elles, visibles selon leur ciblage (et non par dev).
        </Callout>
      </GuideSection>

      <GuideSection title="Sécurité">
        <Callout type="warn">
          Personne ne peut s'auto-promouvoir. Le changement de rôle est :
          <ol className="ml-5 mt-2 list-decimal space-y-1">
            <li>protégé par RLS Postgres,</li>
            <li>bloqué par un trigger DB côté serveur,</li>
            <li>uniquement déclenchable par <code>setUserRoleAction</code> qui exige <code>requireDev()</code>.</li>
          </ol>
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/utilisateurs" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
