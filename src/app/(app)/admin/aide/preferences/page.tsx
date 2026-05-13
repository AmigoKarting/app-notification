import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../layout";

export default function GuidePreferencesPage() {
  return (
    <GuidePage
      title="Mes préférences"
      description="Personnaliser ce que tu vois dans ton fil + ton compte."
    >
      <GuideSection title="Le menu Réglages">
        <p>
          En haut à droite de l'app, clique sur ton <strong>nom</strong>. Tu arrives sur la page
          <Path>/settings</Path> qui regroupe :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Profil</strong> — ton nom affiché et ton email
          </li>
          <li>
            <strong>Apparence</strong> — la couleur d'accent de l'app pour toi
          </li>
          <li>
            <strong>Mes notifications</strong> — les catégories que tu veux masquer
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Mettre une catégorie en sourdine">
        <p>
          Tu reçois trop de notifs d'une certaine catégorie (ex: « Annonces »
          que tu trouves trop fréquentes) ? Tu peux la <strong>masquer</strong> dans ton fil — les
          notifs continuent d'exister, mais tu ne les vois plus.
        </p>
        <Steps>
          <Step number={1} title="Va dans Réglages">
            Top-right → ton nom.
          </Step>
          <Step number={2} title="Section « Mes notifications »">
            Liste de toutes les catégories disponibles.
          </Step>
          <Step number={3} title="Clique sur le badge à droite">
            <strong>🔔 Reçue</strong> → bascule en <strong>🔕 Masquée</strong>. Re-clique pour
            réactiver.
          </Step>
        </Steps>
        <Callout type="info">
          Effet immédiat : la prochaine fois que tu ouvres <Path>/feed</Path>, les notifs de cette
          catégorie ne sont plus affichées. Tu peux toujours les réactiver à tout moment.
        </Callout>
      </GuideSection>

      <GuideSection title="Ton nom affiché">
        <p>
          Dans <strong>Profil</strong>, change le nom qui apparaît à côté de ton email partout dans
          l'app. Sans nom affiché, c'est ton email qui est utilisé par défaut.
        </p>
        <p>
          Si un dev te ping dans une notification ou un commentaire, c'est ce nom qui s'affiche.
        </p>
      </GuideSection>

      <GuideSection title="Couleur d'accent">
        <p>
          Section <strong>Apparence</strong> — choisis parmi 7 palettes (violet, bleu, émeraude…).
          Le changement est immédiat et <strong>mémorisé dans ton navigateur</strong>, donc :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Chaque user a sa propre couleur — pas de conflit.</li>
          <li>Si tu te connectes depuis un autre navigateur, la couleur par défaut s'applique là-bas (à régler de nouveau).</li>
          <li>
            Le branding général de l'app (logo, nom, tagline) est <strong>global</strong> et fixé par
            un dev — c'est différent de la couleur perso.
          </li>
        </ul>
      </GuideSection>

      <GuideNav current="/admin/aide/preferences" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
