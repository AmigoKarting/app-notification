import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideStartPage() {
  return (
    <GuidePage
      title="Bien démarrer"
      description="Comprendre la structure de l'app en 5 minutes."
    >
      <GuideSection title="Les 2 rôles">
        <p>
          Chaque personne qui se connecte a un rôle :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Employé</strong> — voit uniquement les notifications du jour, dans l'onglet Notifications.
          </li>
          <li>
            <strong>Dev (admin)</strong> — voit la même chose plus tout l'administration (création, planification, configuration).
          </li>
        </ul>
        <p>
          Le tout <strong>premier compte créé</strong> est automatiquement dev. Les comptes suivants sont employés par défaut.
          Un dev peut promouvoir d'autres comptes via <Path>Admin → Utilisateurs</Path>.
        </p>
      </GuideSection>

      <GuideSection title="La hiérarchie">
        <p>L'app s'organise en 3 niveaux qui se rangent les uns dans les autres :</p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <pre className="overflow-x-auto text-xs leading-relaxed text-neutral-800">{`Catégorie  (ex: "RH", "Sécurité")
   └── Session  (ex: "Été 2026", peut être activée/désactivée)
          └── Notification  (le message vu par les employés)`}</pre>
        </div>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Catégorie</strong> = une étiquette (couleur + nom). Sert à filtrer dans le fil.
          </li>
          <li>
            <strong>Session</strong> = une période avec une date de début et de fin. Si désactivée, ses notifications n'apparaissent plus.
          </li>
          <li>
            <strong>Notification</strong> = le message lui-même.
          </li>
        </ul>
        <Callout type="info">
          Les 3 niveaux sont <strong>optionnels</strong> sur une notification. Tu peux publier un message sans
          catégorie ni session — il sera juste « toujours visible, sans étiquette ».
        </Callout>
      </GuideSection>

      <GuideSection title="Cibler qui voit quoi">
        <p>Pour chaque notification (ou planification), tu choisis qui la verra :</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Tout le monde</strong> — visible par tous les utilisateurs connectés.
          </li>
          <li>
            <strong>Des équipes</strong> — visible uniquement aux membres des équipes cochées.
          </li>
          <li>
            <strong>Des personnes</strong> — visible uniquement aux comptes cochés.
          </li>
        </ul>
        <p>
          Crée tes équipes une fois dans <Path>Admin → Équipes</Path>, puis tu pourras les sélectionner dans n'importe quelle notification.
        </p>
      </GuideSection>

      <GuideSection title="Notification ponctuelle vs récurrente">
        <p>Deux façons d'envoyer un message :</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Notification</strong> — un message ponctuel, publié maintenant ou à une date précise. Une fois.
          </li>
          <li>
            <strong>Planification</strong> — un message qui se répète automatiquement à des heures et jours choisis (ex: tous les lundis à 9h00).
          </li>
        </ul>
        <p>
          Une planification <strong>génère</strong> automatiquement une notification à chaque tir. Tu peux la mettre en pause à tout moment.
        </p>
      </GuideSection>

      <GuideSection title="Ta première notification en 30 secondes">
        <Steps>
          <Step number={1} title="Va sur Notifications">
            Dans la sidebar gauche, clique <Path>Notifications</Path>.
          </Step>
          <Step number={2} title="Clique « Nouvelle »">
            En haut à droite, bouton violet.
          </Step>
          <Step number={3} title="Remplis 2 champs">
            Un <strong>Titre</strong> et un <strong>Message</strong>. C'est tout ce qui est obligatoire.
          </Step>
          <Step number={4} title="Choisis les destinataires">
            « Tout le monde » par défaut. Tu peux passer en équipes ou personnes plus tard.
          </Step>
          <Step number={5} title="Clique « Publier »">
            Visible immédiatement dans le fil de tous les destinataires.
          </Step>
        </Steps>
        <Callout type="tip">
          Pas besoin de toucher aux sections Classement / Dates si tu veux juste publier un message simple maintenant.
        </Callout>
      </GuideSection>

      <GuideSection title="Et après ?">
        <p>
          Quand tu seras à l'aise avec le basique, explore :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <Path>Planifications</Path> — automatise tes envois récurrents.
          </li>
          <li>
            <Path>Catégories</Path> — étiquettes colorées pour ranger.
          </li>
          <li>
            <Path>Sessions</Path> — périodes pour faire varier le contenu selon la saison.
          </li>
          <li>
            <Path>Équipes</Path> — groupes d'utilisateurs pour cibler tes envois.
          </li>
        </ul>
      </GuideSection>

      <GuideNav current="/admin/aide/bien-demarrer" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
