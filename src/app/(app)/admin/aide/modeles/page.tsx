import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideTemplatesPage() {
  return (
    <GuidePage
      title="Modèles réutilisables"
      description="Gagner du temps en partant d'un modèle pré-rempli."
    >
      <GuideSection title="À quoi ça sert ?">
        <p>
          Un <strong>modèle</strong> est une notification pré-remplie que tu sauvegardes une fois et
          que tu peux <strong>charger</strong> à chaque fois que tu crées une nouvelle notif similaire.
          Tu modifies juste les petites différences avant de publier.
        </p>
        <p>
          Cas d'usage typiques : <em>Annonce hebdomadaire</em>, <em>Rappel paie</em>,
          <em> Bienvenue nouvel arrivant</em>, <em>Maintenance planifiée</em>.
        </p>
      </GuideSection>

      <GuideSection title="Créer un modèle">
        <Steps>
          <Step number={1} title="Va sur Admin → Modèles">
            Dans la sidebar, section <strong>Contenu</strong>.
          </Step>
          <Step number={2} title="Clique « Nouveau modèle »">
            Tu retrouves les mêmes champs que pour une notification normale, plus un champ
            <strong> Nom du modèle</strong> (pour t'y retrouver dans la liste).
          </Step>
          <Step number={3} title="Remplis avec les valeurs par défaut">
            Tu peux laisser des trous (ex: titre générique « Annonce de la semaine »). Tu pourras
            les compléter à chaque utilisation.
          </Step>
          <Step number={4} title="Utilise les variables pour personnaliser">
            <code className="rounded bg-neutral-100 px-1">{"{name}"}</code> sera remplacé par le nom
            de chaque destinataire au moment de l'envoi externe.
          </Step>
          <Step number={5} title="Enregistre">
            Le modèle apparaît dans <Path>Admin → Modèles</Path>.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Charger un modèle">
        <Steps>
          <Step number={1} title="Va sur Admin → Notifications → Nouvelle">
            La page de création de notification.
          </Step>
          <Step number={2} title="Sélecteur « 📋 Partir d'un modèle »">
            En haut du formulaire (bandeau doré). Choisis ton modèle dans la liste, clique
            <strong> Charger</strong>.
          </Step>
          <Step number={3} title="Le formulaire se remplit automatiquement">
            Titre, message, type, priorité, catégorie, bouton CTA, canaux d'envoi — tout est
            pré-rempli depuis le modèle.
          </Step>
          <Step number={4} title="Adapte si besoin, puis publie">
            Tu peux modifier n'importe quel champ avant de cliquer <strong>Publier</strong>.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Modifier ou supprimer un modèle">
        <p>
          Sur <Path>Admin → Modèles</Path>, clique sur un modèle pour le modifier. Bouton
          <strong> Supprimer</strong> en bas du formulaire.
        </p>
        <Callout type="info">
          Modifier un modèle n'affecte pas les notifications déjà publiées à partir de ce modèle.
          Une notification créée à partir d'un modèle est <strong>indépendante</strong> après
          publication.
        </Callout>
      </GuideSection>

      <GuideSection title="Per-dev">
        <Callout type="info">
          Chaque dev a ses propres modèles. Un autre dev ne voit pas les tiens. C'est pour éviter
          que ta liste de modèles soit polluée par ceux des autres.
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/modeles" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
