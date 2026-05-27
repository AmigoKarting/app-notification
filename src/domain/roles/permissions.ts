/**
 * Liste centrale des permissions disponibles dans l'app.
 *
 * Cette liste est la source de vérité pour ce qu'un dev peut cocher
 * dans /admin/roles. Une permission existe dans le code → elle est
 * proposée à la coche. Les permissions stockées en BD mais absentes
 * ici sont ignorées (orphelines).
 *
 * Format de clé : "<groupe>.<action>"
 */

export type PermissionGroup = "feed" | "checklist" | "admin" | "settings" | "notifications";

export interface PermissionDef {
  key: string;
  group: PermissionGroup;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
}

export const PERMISSIONS: PermissionDef[] = [
  // ----- feed -----
  {
    key: "feed.read",
    group: "feed",
    labelFr: "Voir le fil de notifications",
    labelEn: "View notification feed",
    descFr: "Accès à /feed et aux notifications ciblées.",
    descEn: "Access /feed and targeted notifications.",
  },
  {
    key: "feed.write",
    group: "feed",
    labelFr: "Créer / modifier les notifications",
    labelEn: "Create / edit notifications",
    descFr: "Publier, modifier, dupliquer ou supprimer des notifications.",
    descEn: "Publish, edit, duplicate or delete notifications.",
  },

  // ----- checklist -----
  {
    key: "checklist.view",
    group: "checklist",
    labelFr: "Voir la checklist du jour",
    labelEn: "View daily checklist",
    descFr: "Accès à la page /checklist.",
    descEn: "Access the /checklist page.",
  },
  {
    key: "checklist.submit",
    group: "checklist",
    labelFr: "Soumettre une checklist",
    labelEn: "Submit a checklist",
    descFr: "Remplir et envoyer la checklist quotidienne.",
    descEn: "Fill out and submit the daily checklist.",
  },

  // ----- notifications -----
  {
    key: "notifications.mute",
    group: "notifications",
    labelFr: "Désactiver des catégories",
    labelEn: "Mute categories",
    descFr: "Choisir quelles catégories de notifications recevoir.",
    descEn: "Choose which notification categories to receive.",
  },

  // ----- admin (sections du panneau d'administration) -----
  {
    key: "admin.access",
    group: "admin",
    labelFr: "Accéder au panneau admin",
    labelEn: "Access admin panel",
    descFr: "Voir /admin et naviguer dans les sections autorisées.",
    descEn: "View /admin and navigate authorized sections.",
  },
  {
    key: "admin.feed",
    group: "admin",
    labelFr: "Gérer les notifications publiées",
    labelEn: "Manage published notifications",
    descFr: "Section /admin/feed : CRUD complet.",
    descEn: "Section /admin/feed: full CRUD.",
  },
  {
    key: "admin.users",
    group: "admin",
    labelFr: "Gérer les utilisateurs",
    labelEn: "Manage users",
    descFr: "Voir la liste, changer les rôles.",
    descEn: "View list, change roles.",
  },
  {
    key: "admin.categories",
    group: "admin",
    labelFr: "Gérer les catégories",
    labelEn: "Manage categories",
    descFr: "Section /admin/categories.",
    descEn: "Section /admin/categories.",
  },
  {
    key: "admin.sessions",
    group: "admin",
    labelFr: "Gérer les périodes",
    labelEn: "Manage sessions",
    descFr: "Section /admin/sessions.",
    descEn: "Section /admin/sessions.",
  },
  {
    key: "admin.teams",
    group: "admin",
    labelFr: "Gérer les équipes",
    labelEn: "Manage teams",
    descFr: "Section /admin/teams.",
    descEn: "Section /admin/teams.",
  },
  {
    key: "admin.templates",
    group: "admin",
    labelFr: "Gérer les modèles",
    labelEn: "Manage templates",
    descFr: "Section /admin/templates.",
    descEn: "Section /admin/templates.",
  },
  {
    key: "admin.schedules",
    group: "admin",
    labelFr: "Gérer les planifications",
    labelEn: "Manage schedules",
    descFr: "Section /admin/schedules.",
    descEn: "Section /admin/schedules.",
  },
  {
    key: "admin.deliveries",
    group: "admin",
    labelFr: "Voir les envois",
    labelEn: "View deliveries",
    descFr: "Section /admin/deliveries (audit email / SMS / push).",
    descEn: "Section /admin/deliveries (email / SMS / push audit).",
  },
  {
    key: "admin.analytics",
    group: "admin",
    labelFr: "Voir les statistiques",
    labelEn: "View analytics",
    descFr: "Section /admin/analytics.",
    descEn: "Section /admin/analytics.",
  },
  {
    key: "admin.branding",
    group: "admin",
    labelFr: "Personnaliser la marque",
    labelEn: "Customize branding",
    descFr: "Section /admin/branding (nom, logo, tagline).",
    descEn: "Section /admin/branding (name, logo, tagline).",
  },
  {
    key: "admin.checklists_history",
    group: "admin",
    labelFr: "Voir l'historique des checklists",
    labelEn: "View checklist history",
    descFr: "Section /admin/checklists.",
    descEn: "Section /admin/checklists.",
  },
  {
    key: "admin.checklist_tasks",
    group: "admin",
    labelFr: "Gérer les tâches de checklist",
    labelEn: "Manage checklist tasks",
    descFr: "Section /admin/checklist-tasks (ajout / édition / désactivation).",
    descEn: "Section /admin/checklist-tasks (add / edit / disable).",
  },
  {
    key: "admin.roles",
    group: "admin",
    labelFr: "Gérer les rôles et permissions",
    labelEn: "Manage roles & permissions",
    descFr: "Section /admin/roles. ⚠️ Donne le contrôle de l'accès des autres utilisateurs.",
    descEn: "Section /admin/roles. ⚠️ Grants control over other users' access.",
  },

  // ----- settings -----
  {
    key: "settings.cashier_banner",
    group: "settings",
    labelFr: "Modifier la bannière caissière",
    labelEn: "Edit cashier banner",
    descFr: "Texte et état actif/inactif de la bannière de rappel.",
    descEn: "Text and on/off state of the reminder banner.",
  },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export function getPermissionsByGroup(): Record<PermissionGroup, PermissionDef[]> {
  const out: Record<PermissionGroup, PermissionDef[]> = {
    feed: [],
    checklist: [],
    admin: [],
    settings: [],
    notifications: [],
  };
  for (const p of PERMISSIONS) out[p.group].push(p);
  return out;
}

export const GROUP_LABELS: Record<PermissionGroup, { fr: string; en: string }> = {
  feed: { fr: "Fil de notifications", en: "Notification feed" },
  checklist: { fr: "Checklist", en: "Checklist" },
  notifications: { fr: "Préférences notifications", en: "Notification preferences" },
  admin: { fr: "Administration", en: "Administration" },
  settings: { fr: "Réglages", en: "Settings" },
};
