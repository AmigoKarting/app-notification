import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideSendPage() {
  return (
    <GuidePage
      title="Publier une notification"
      description="Toutes les options disponibles, de l'envoi simple à la config avancée."
    >
      <GuideSection title="Le formulaire en 5 blocs">
        <p>
          Sur <Path>Admin → Notifications → Nouvelle</Path> tu trouves 5 sections empilées :
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            <strong>Contenu</strong> — titre, message, image, bouton CTA
          </li>
          <li>
            <strong>Diffusion</strong> — brouillon, épinglé, canaux d'envoi externes
          </li>
          <li>
            <strong>Destinataires</strong> — qui voit la notification
          </li>
          <li>
            <strong>Classement</strong> — type, priorité, catégorie, période
          </li>
          <li>
            <strong>Dates</strong> — quand publier, quand cacher, échéance pour rappels
          </li>
        </ol>
        <p>
          Pour un envoi simple à tout le monde, seuls <strong>Titre</strong> et
          <strong> Message</strong> sont obligatoires. Tout le reste a des valeurs par défaut sensées.
        </p>
      </GuideSection>

      <GuideSection title="1 · Contenu">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Titre</strong> — en gras dans le fil. Max 160 caractères.
          </li>
          <li>
            <strong>Message</strong> — corps du message. <strong>Markdown supporté</strong> (gras, italique, code, liens) et <strong>variables</strong> <code>{"{name}"}</code> / <code>{"{email}"}</code> pour les envois externes. Le petit accordéon "💡" sous le champ rappelle la syntaxe.
          </li>
          <li>
            <strong>Image</strong> — PNG/JPG/WebP/SVG, 5 Mo max. Affichée en tête de la card dans le fil. Stockée dans Supabase Storage (bucket <code>notifications</code>).
          </li>
          <li>
            <strong>Bouton (CTA)</strong> — <strong>Libellé</strong> + <strong>URL</strong> (les deux ou aucun). Renders un gros bouton violet en bas de la card qui ouvre l'URL dans un nouvel onglet.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="2 · Diffusion">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Brouillon</strong> — coche pour sauvegarder sans publier. <strong>Toi seul vois le brouillon</strong> ; aucun destinataire ne l'a dans son fil. Décoche pour publier.
          </li>
          <li>
            <strong>Épingler en haut</strong> — coche pour que la notification reste en tête du fil chez les destinataires, peu importe sa date.
          </li>
          <li>
            <strong>Envoyer aussi par</strong> — checkboxes <strong>📧 Email</strong> / <strong>💬 SMS</strong>. À la publication, chaque destinataire reçoit aussi un message externe sur le canal choisi (nécessite un provider configuré — voir <Path>/admin/aide/production</Path>).
          </li>
        </ul>
        <Callout type="info">
          Les options Diffusion sont aussi accessibles d'un clic depuis la liste <Path>/admin/feed</Path> :
          icône 📌 pour épingler/désépingler, icône 📋 pour dupliquer.
        </Callout>
      </GuideSection>

      <GuideSection title="3 · Destinataires">
        <p>3 modes en cartes radio :</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Tout le monde</strong> — tous les utilisateurs connectés.
          </li>
          <li>
            <strong>Des équipes</strong> — checkbox list des équipes existantes.
          </li>
          <li>
            <strong>Des personnes</strong> — checkbox list de tous les utilisateurs, avec barre de recherche.
          </li>
        </ul>
        <p>
          Les <strong>brouillons</strong> ignorent ce ciblage : ils restent uniquement visibles
          pour leur créateur, même si le mode est "tout le monde".
        </p>
      </GuideSection>

      <GuideSection title="4 · Classement">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Type</strong> — <em>Notification</em> (info pure) ou <em>Rappel</em> (avec date limite affichée). Un rappel doit avoir une date limite.
          </li>
          <li>
            <strong>Priorité</strong> — Basse / Normale / Haute. Une priorité haute ajoute un badge rouge "Priorité haute" dans la card.
          </li>
          <li>
            <strong>Catégorie</strong> — étiquette colorée optionnelle. Aide les destinataires à filtrer leur fil.
          </li>
          <li>
            <strong>Période</strong> — si choisie, la notif est masquée tant que la période n'est pas active OU si la période est désactivée par toi.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="5 · Dates">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Publier le…</strong> — vide = maintenant. Remplis pour programmer une publication future ponctuelle.
          </li>
          <li>
            <strong>Cacher après le…</strong> — vide = jamais. La notif disparaît automatiquement à cette date.
          </li>
          <li>
            <strong>Date limite (si rappel)</strong> — affichée dans la card pour rappeler l'échéance. Si dépassée, mention "en retard" en rouge.
          </li>
        </ul>
        <Callout type="info">
          Pour des envois <strong>récurrents</strong> (ex: tous les lundis à 9h), utilise
          plutôt <Path>Planifications</Path> au lieu de mettre une date dans cette section.
        </Callout>
      </GuideSection>

      <GuideSection title="Gagner du temps avec les modèles">
        <p>
          Si tu publies souvent des notifs similaires, crée un{" "}
          <strong>modèle</strong> dans <Path>Admin → Modèles</Path>. Ensuite, sur
          <Path> Admin → Notifications → Nouvelle</Path>, un bandeau <strong>"📋 Partir d'un modèle"</strong>
          en haut du formulaire te permet de pré-remplir tous les champs en 1 clic.
        </p>
        <p>
          Détails dans le guide <Path>Modèles réutilisables</Path>.
        </p>
      </GuideSection>

      <GuideSection title="Dupliquer une notification existante">
        <p>
          Sur la liste <Path>Admin → Notifications</Path>, icône <strong>📋</strong> à droite de
          chaque ligne. Sur la page d'édition, bouton <strong>📋 Dupliquer</strong> en haut.
        </p>
        <p>
          La copie est créée en <strong>brouillon</strong> avec le titre préfixé "Copie de …" — tu
          modifies ce que tu veux puis tu publies. Le ciblage et les targets ne sont
          <strong> pas copiés</strong> (tu re-cibles dans le form).
        </p>
      </GuideSection>

      <GuideSection title="Après publication">
        <Steps>
          <Step number={1} title="Apparaît dans le fil">
            Tous les destinataires la voient dans leur onglet Notifications, sauf ceux qui ont mis
            la catégorie en sourdine dans leurs <Path>Réglages</Path>.
          </Step>
          <Step number={2} title="Engagement temps réel">
            Lectures, réactions et commentaires des destinataires remontent dans
            <Path> Admin → Notifications → [la notif]</Path> (cards "Lectures + Réactions" et "Détail de l'engagement").
          </Step>
          <Step number={3} title="Envois externes (si activés)">
            Si tu as coché 📧 Email ou 💬 SMS, les envois partent via la couche <code>notify()</code>.
            L'audit est dans <Path>Admin → Envois</Path>.
          </Step>
          <Step number={4} title="Modifier ou supprimer">
            <Path>Admin → Notifications</Path>, clique sur la notif. Modifs et suppression
            réversibles via les boutons.
          </Step>
        </Steps>
      </GuideSection>

      <GuideNav current="/admin/aide/envoyer-notification" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
