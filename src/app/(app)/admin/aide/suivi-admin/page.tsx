import { Callout, GuideNav, GuidePage, GuideSection, Path } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideAdminTrackingPage() {
  return (
    <GuidePage
      title="Suivi côté admin"
      description="Stats détaillées, filtres, audit — savoir ce qui se passe dans l'app."
    >
      <GuideSection title="Vue d'ensemble (Aperçu)">
        <p>
          Sur <Path>Admin → Aperçu</Path> tu vois :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>2 boutons d'action</strong> en haut : Envoyer une notification / Planifier un envoi récurrent
          </li>
          <li>
            <strong>4 stats cliquables</strong> : Notifications publiées, Planifications actives, Sessions en cours, Catégories
          </li>
          <li>
            <strong>2 listes</strong> : Dernières notifications publiées + Prochains envois automatiques
          </li>
        </ul>
        <p>
          Chaque stat ouvre la liste correspondante. Chaque ligne de liste mène à la fiche détaillée.
        </p>
      </GuideSection>

      <GuideSection title="Stats par notification">
        <p>
          Sur <Path>Admin → Notifications → [une notif]</Path>, deux cards de stats en haut :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Lectures</strong> — combien d'utilisateurs ont cliqué "Marquer comme lu".
          </li>
          <li>
            <strong>Réactions</strong> — récap des emojis utilisés avec leur compteur (👍 5, ❤️ 2, etc.).
          </li>
        </ul>
        <p>
          Plus bas, card <strong>"Détail de l'engagement"</strong> qui détaille en 3 colonnes :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Lecteurs</strong> — qui a lu, avec l'horodatage exact
          </li>
          <li>
            <strong>Réactions par utilisateur</strong> — qui a réagi avec quels emojis (un user peut en cumuler plusieurs)
          </li>
          <li>
            <strong>Commentaires</strong> — aperçu des 5 derniers
          </li>
        </ul>
        <Callout type="info">
          Limité à 10 entrées par colonne pour rester lisible. Au-delà, mention "+ X autres". Cette
          card n'apparaît pas si la notif est en brouillon (pas encore visible aux destinataires).
        </Callout>
      </GuideSection>

      <GuideSection title="Filtres sur la liste des notifications">
        <p>
          <Path>Admin → Notifications</Path> propose 3 filtres combinables :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Recherche libre</strong> (barre en haut) — cherche dans le titre ET le contenu.
          </li>
          <li>
            <strong>Type</strong> (pastilles) — Tous / Notifications / Rappels.
          </li>
          <li>
            <strong>Auteur</strong> (select à droite) — visible seulement s'il y a 2 devs ou plus. Permet de voir qui a publié quoi.
          </li>
        </ul>
        <p>
          Les filtres se combinent et restent dans l'URL — tu peux partager une URL filtrée.
        </p>
      </GuideSection>

      <GuideSection title="Audit des envois externes">
        <p>
          <Path>Admin → Envois</Path> liste <strong>chaque tentative d'envoi par email/SMS</strong> :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Date, canal, destinataire</li>
          <li>Sujet et aperçu du contenu</li>
          <li>Statut (envoyé, échec, ignoré, en file)</li>
          <li>Provider utilisé (mock, Resend, Twilio…) et ID de message côté provider</li>
          <li>Si échec : le message d'erreur exact</li>
        </ul>
        <p>
          Cards "Canaux enregistrés" en haut indiquent quels providers sont configurés
          (vert = OK, gris = pas de clés API). Filtres par canal et par statut.
        </p>
      </GuideSection>

      <GuideSection title="Suivi des planifications">
        <p>
          <Path>Admin → Planifications</Path> liste les recettes récurrentes :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>État cliquable</strong> Actif / Pausé — toggle d'un clic
          </li>
          <li>
            <strong>Prochaine exécution</strong> calculée automatiquement (incluant DST)
          </li>
          <li>
            <strong>Dernière exécution</strong> visible
          </li>
        </ul>
        <p>
          Sur le détail d'une planification, bandeau d'informations en haut + édition du contenu, du
          ciblage et du calendrier.
        </p>
      </GuideSection>

      <GuideSection title="Utilisateurs et rôles">
        <p>
          <Path>Admin → Utilisateurs</Path> liste tous les comptes inscrits :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Recherche par nom ou email</li>
          <li>Filtre par rôle (Tous / Devs / Employés)</li>
          <li>Bouton Promouvoir / Rétrograder à droite de chaque ligne (sauf toi)</li>
          <li>Date d'inscription visible</li>
        </ul>
      </GuideSection>

      <GuideSection title="Logs serveur">
        <p>
          Tous les événements importants (envois, erreurs, claims du worker) sont loggés en JSON
          dans la console Vercel. Pour les retrouver :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Vercel → ton projet → <Path>Logs</Path></li>
          <li>Filtre par scope: <code>messaging.*</code>, <code>schedules.*</code>, <code>reminders.*</code>, <code>app.error</code></li>
          <li>Chaque ligne contient un <code>runId</code> pour tracer une exécution entière</li>
        </ul>
        <p>
          Pour recevoir une notification quand une erreur arrive, configure
          <code> ERROR_WEBHOOK_URL</code> (Discord, Slack, Sentry…). Détails dans
          <Path> Mettre en production</Path>.
        </p>
      </GuideSection>

      <GuideNav current="/admin/aide/suivi-admin" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}
