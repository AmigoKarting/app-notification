import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideCustomizePage() {
  return (
    <GuidePage
      title="Personnaliser l'app"
      description="Logo, nom, tagline et couleur d'accent."
    >
      <GuideSection title="Deux niveaux de personnalisation">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Marque</strong> (réglé par un dev) — logo, nom de l'app, tagline. Affecte tout le monde.
          </li>
          <li>
            <strong>Apparence</strong> (réglé par chaque utilisateur) — couleur d'accent. Mémorisée par
            navigateur, propre à chaque personne.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Changer le logo et le nom (marque)">
        <Steps>
          <Step number={1} title="Va sur Admin → Marque">
            Sidebar gauche, section Système.
          </Step>
          <Step number={2} title="Logo">
            Clique « Choisir un fichier » et sélectionne ton image (PNG, JPG ou SVG, 2 Mo max).
            L'aperçu apparaît immédiatement.
          </Step>
          <Step number={3} title="Nom de l'application">
            Remplace « App Notification » par ton nom (ex: « AmigoKarting »). Affiché à côté du logo.
          </Step>
          <Step number={4} title="Tagline (optionnel)">
            Phrase d'accroche affichée sur la page d'accueil publique.
          </Step>
          <Step number={5} title="Clique « Enregistrer »">
            Recharge n'importe quelle page de l'app pour voir le résultat.
          </Step>
        </Steps>
        <Callout type="info">
          Le logo est uploadé dans Supabase Storage (bucket <code>branding</code>). Seuls les devs peuvent uploader
          ou supprimer — les employés n'ont aucun droit dessus.
        </Callout>
      </GuideSection>

      <GuideSection title="Changer la couleur d'accent (apparence)">
        <Steps>
          <Step number={1} title="Va sur ton profil">
            En haut à droite, clique sur ton nom (ou ton avatar).
          </Step>
          <Step number={2} title="Section « Apparence »">
            Tu vois 7 pastilles de couleur : Violet, Indigo, Bleu, Émeraude, Rose, Orange, Ardoise.
          </Step>
          <Step number={3} title="Clique une pastille">
            Tout change immédiatement (boutons, badges, accents). Pas besoin de recharger.
          </Step>
        </Steps>
        <Callout type="info">
          Ce réglage est <strong>local à ton navigateur</strong> — un autre utilisateur peut choisir une autre
          couleur, et tu garderas la tienne. Si tu te connectes depuis un autre ordinateur, tu retrouveras la couleur
          par défaut, à ré-régler là-bas.
        </Callout>
      </GuideSection>

      <GuideSection title="Cas d'usage : white-label">
        <p>
          Si tu revends cette application à un client, voici les 5 étapes pour qu'elle ressemble à la sienne :
        </p>
        <Steps>
          <Step number={1} title="Connecter son projet Supabase">
            Variables d'env <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
            <code> SUPABASE_SERVICE_ROLE_KEY</code>.
          </Step>
          <Step number={2} title="Appliquer les migrations">
            Lance les migrations 0001 à 0009 dans son SQL Editor.
          </Step>
          <Step number={3} title="Connecter ses providers d'envoi (optionnel)">
            <code>EMAIL_PROVIDER</code> + <code>RESEND_API_KEY</code> pour les emails, <code>SMS_PROVIDER</code>
            + <code>TWILIO_*</code> pour les SMS.
          </Step>
          <Step number={4} title="Configurer la marque">
            Le premier compte créé devient dev. Il va sur <Path>Admin → Marque</Path>, upload son logo,
            son nom, sa tagline.
          </Step>
          <Step number={5} title="Choisir la couleur">
            Réglages → Apparence. C'est prêt à être utilisé.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Modifier son nom affiché">
        <p>
          En haut à droite → ton nom → section « Profil ». Le nom affiché remplace l'email un peu partout dans
          l'app (header, liste des utilisateurs, sélecteur dans les notifications ciblées).
        </p>
        <p>
          Un dev peut aussi nommer un autre utilisateur indirectement via <Path>Admin → Utilisateurs</Path> (édition
          du profil n'est pas exposée pour l'instant — chaque user gère son propre nom).
        </p>
      </GuideSection>

      <GuideNav current="/admin/aide/personnaliser" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
