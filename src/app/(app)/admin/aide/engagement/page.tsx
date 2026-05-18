import { Callout, GuideNav, GuidePage, GuideSection, Path } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideEngagementPage() {
  return (
    <GuidePage
      title="Réactions et commentaires"
      description="Comment les employés interagissent avec les notifications, et ce que tu vois côté admin."
    >
      <GuideSection title="Marquer comme lu">
        <p>
          Chaque employé voit un bouton <strong>« Marquer comme lu »</strong> en bas de chaque
          notification. Un clic suffit pour basculer en <strong>« ✓ Lu »</strong>. Re-cliquer remet
          en non lu.
        </p>
        <p>
          C'est purement informatif — la notification reste visible. C'est le user qui décide ce
          qui compte comme « lu » pour lui.
        </p>
      </GuideSection>

      <GuideSection title="Réactions emoji">
        <p>
          5 emojis par défaut sous chaque notification : 👍 ❤️ 😄 🎉 🚀. Click pour réagir,
          re-click pour retirer. Le compteur affiche le nombre total de personnes ayant utilisé cet
          emoji.
        </p>
        <p>
          Bouton <strong>+</strong> à la fin pour ajouter <strong>n'importe quel emoji</strong>
          (custom). Il sera mémorisé et apparaîtra pour les futurs utilisateurs qui voudront aussi
          le réutiliser.
        </p>
      </GuideSection>

      <GuideSection title="Commentaires">
        <p>
          Sous chaque notification, bouton <strong>💬 Ajouter un commentaire</strong>. Ça déplie un
          fil de discussion + une zone de texte.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Chacun peut commenter une notification qu'il voit.</li>
          <li>
            Chaque user peut <strong>supprimer ses propres commentaires</strong> (croix à droite).
          </li>
          <li>Les commentaires apparaissent dans l'ordre chronologique.</li>
          <li>Max 2000 caractères par commentaire.</li>
        </ul>
        <Callout type="info">
          Les commentaires sont attachés à la notification — si la notification est supprimée par
          un dev, les commentaires partent avec (cascade DB).
        </Callout>
      </GuideSection>

      <GuideSection title="Stats côté admin">
        <p>
          Sur <Path>Admin → Notifications → [une notif]</Path>, tu vois deux cards en haut :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Card « Lectures + Réactions »</strong> — compteurs agrégés.
          </li>
          <li>
            <strong>Card « Détail de l'engagement »</strong> (si au moins 1 lecture, réaction ou
            commentaire) — trois colonnes :
            <ul className="ml-5 mt-1 list-disc space-y-0.5 text-xs">
              <li>Liste des lecteurs (nom + horodatage)</li>
              <li>Liste des réactions par utilisateur (qui a mis quoi)</li>
              <li>Aperçu des 5 derniers commentaires</li>
            </ul>
          </li>
        </ul>
        <p>
          Au-delà de 10 entrées par colonne, le reste est résumé par « + X autres ».
        </p>
      </GuideSection>

      <GuideSection title="Sécurité et vie privée">
        <Callout type="warn">
          <p className="mb-1">
            Tu vois <strong>qui</strong> a lu et réagi à tes notifications. Les employés en sont
            informés via ce guide. Si ton contexte demande de l'anonymat, n'utilise pas la fonction
            « marquer comme lu » comme outil de tracking — c'est un signal d'intention, pas une
            preuve d'attention.
          </p>
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/engagement" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
