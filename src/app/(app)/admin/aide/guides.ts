export interface GuideEntry {
  href: string;
  title: string;
  icon: string;
  description?: string;
}

export interface GuideCategory {
  label: string;
  entries: GuideEntry[];
}

/**
 * Ordre canonique des guides. Sert au layout (sidebar) ET aux pages
 * (pour calculer Précédent/Suivant).
 */
export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    label: "Premiers pas",
    entries: [
      {
        href: "/admin/aide/bien-demarrer",
        title: "Bien démarrer",
        icon: "⚡",
        description: "Tour rapide de l'app",
      },
    ],
  },
  {
    label: "Notifications",
    entries: [
      {
        href: "/admin/aide/envoyer-notification",
        title: "Publier une notification",
        icon: "🔔",
        description: "Création, ciblage, dates",
      },
      {
        href: "/admin/aide/planifier",
        title: "Planifier des envois récurrents",
        icon: "🕐",
        description: "Heures, jours, fuseau",
      },
      {
        href: "/admin/aide/modeles",
        title: "Modèles réutilisables",
        icon: "📋",
        description: "Gagner du temps",
      },
      {
        href: "/admin/aide/mise-en-forme",
        title: "Mise en forme et variables",
        icon: "📝",
        description: "Markdown + {name} {email}",
      },
      {
        href: "/admin/aide/engagement",
        title: "Réactions et commentaires",
        icon: "💬",
        description: "Lectures, réactions, fils",
      },
      {
        href: "/admin/aide/suivi-admin",
        title: "Suivi côté admin",
        icon: "📊",
        description: "Stats, filtres, audit",
      },
    ],
  },
  {
    label: "Organisation",
    entries: [
      {
        href: "/admin/aide/categories",
        title: "Catégories",
        icon: "🏷",
        description: "Étiquettes colorées",
      },
      {
        href: "/admin/aide/sessions",
        title: "Sessions et périodes",
        icon: "📅",
        description: "Fenêtres temporelles",
      },
      {
        href: "/admin/aide/equipes",
        title: "Équipes",
        icon: "👥",
        description: "Groupes de personnes",
      },
    ],
  },
  {
    label: "Utilisateurs",
    entries: [
      {
        href: "/admin/aide/utilisateurs",
        title: "Rôles et permissions",
        icon: "👤",
        description: "Dev vs employé",
      },
      {
        href: "/admin/aide/preferences",
        title: "Mes préférences",
        icon: "🔕",
        description: "Mute, profil, thème",
      },
    ],
  },
  {
    label: "Personnalisation",
    entries: [
      {
        href: "/admin/aide/personnaliser",
        title: "Logo et apparence",
        icon: "🖌",
        description: "Marque + couleur",
      },
    ],
  },
  {
    label: "Déploiement",
    entries: [
      {
        href: "/admin/aide/production",
        title: "Mettre en production",
        icon: "🚀",
        description: "Supabase + Vercel + Resend + cron",
      },
    ],
  },
];

export const FLAT_GUIDES: GuideEntry[] = GUIDE_CATEGORIES.flatMap((c) => c.entries);
