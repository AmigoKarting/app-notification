import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideTeamsPage() {
  return (
    <GuidePage
      title="Équipes"
      description="Regrouper des personnes pour cibler tes envois rapidement."
    >
      <GuideSection title="À quoi ça sert ?">
        <p>
          Une équipe est un <strong>regroupement nommé</strong> de plusieurs utilisateurs. Elle te permet
          d'envoyer une notification à <em>tous les membres d'un coup</em>, sans devoir cocher chaque personne.
        </p>
        <p>
          Exemples : <em>Commerciaux</em>, <em>Tech</em>, <em>Direction</em>, <em>Nouveaux arrivants</em>.
        </p>
      </GuideSection>

      <GuideSection title="Créer une équipe">
        <Steps>
          <Step number={1} title="Va sur Équipes">
            Sidebar → <Path>Équipes</Path> → « Nouvelle équipe ».
          </Step>
          <Step number={2} title="Slug + Nom + Couleur">
            Slug court (ex: <code>commerciaux</code>), nom lisible et une couleur pour repérer visuellement.
          </Step>
          <Step number={3} title="Crée">
            L'équipe existe mais elle est vide. Tu vas l'ouvrir pour y ajouter des membres.
          </Step>
          <Step number={4} title="Ouvre l'équipe et coche les membres">
            Sur la page de l'équipe, section « Membres ». Coche les utilisateurs concernés. Champ de recherche
            disponible si tu en as beaucoup.
          </Step>
          <Step number={5} title="Clique « Enregistrer les membres »">
            La liste est sauvegardée. Tu peux la modifier à tout moment.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Cibler une équipe dans une notification">
        <p>
          Dans le formulaire d'une notification ou d'une planification, section <strong>Destinataires</strong> :
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Clique la carte <strong>« Des équipes »</strong>.</li>
          <li>Coche une ou plusieurs équipes dans la liste qui apparaît.</li>
          <li>Publie. Tous les membres des équipes cochées verront la notif.</li>
        </ol>
        <Callout type="tip">
          Tu peux cocher <strong>plusieurs équipes</strong>. La notif est visible aux membres de <em>l'une ou
          l'autre</em> des équipes (union, pas intersection).
        </Callout>
      </GuideSection>

      <GuideSection title="Modifier les membres après coup">
        <p>
          Va sur <Path>Équipes</Path>, ouvre l'équipe, ajoute/retire des coches, enregistre. Toutes les notifications
          ciblées par cette équipe verront automatiquement les nouveaux membres (et plus les anciens si tu en retires).
        </p>
        <p>
          La RLS Postgres garantit qu'un utilisateur retiré ne voit plus la notif au prochain rafraîchissement.
        </p>
      </GuideSection>

      <GuideSection title="Supprimer une équipe">
        <p>
          Sur la page de l'équipe, bouton « Supprimer » en bas. Les notifications qui ciblaient cette équipe
          perdent le lien mais ne sont pas supprimées (elles n'auront juste plus de destinataires via cette équipe).
        </p>
      </GuideSection>

      <GuideSection title="Cas d'usage typique">
        <Callout type="tip">
          <p className="mb-2"><strong>Onboarding</strong> :</p>
          <ol className="ml-5 list-decimal space-y-1">
            <li>Crée une équipe « Nouveaux arrivants ».</li>
            <li>Crée une planification « Tip du jour — onboarding » qui cible cette équipe, tous les jours à 9h.</li>
            <li>Ajoute chaque nouvelle recrue à cette équipe le jour de son arrivée.</li>
            <li>Retire-la au bout d'un mois — elle ne recevra plus ces messages, automatiquement.</li>
          </ol>
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/equipes" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
