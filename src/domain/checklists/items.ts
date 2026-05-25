export interface ChecklistItem {
  key: string;
  section: "opening" | "during" | "closing";
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Avant l'ouverture
  { key: "voicemail", section: "opening" },
  { key: "hoods_wash_opening", section: "opening" },
  { key: "check_bathrooms_opening", section: "opening" },
  { key: "check_reservations", section: "opening" },

  // Durant le quart
  { key: "clean_bathrooms_during", section: "during" },
  { key: "hoods_wash_during", section: "during" },
  { key: "clean_site_tables", section: "during" },
  { key: "empty_trash_recycling", section: "during" },
  { key: "copy_forms", section: "during" },
  { key: "check_waivers", section: "during" },

  // Avant de quitter
  { key: "fill_fridge_displays", section: "closing" },
  { key: "clean_site_red_zone", section: "closing" },
  { key: "clean_bathrooms_closing", section: "closing" },
  { key: "sweep_mop_toilets", section: "closing" },
  { key: "fold_hoods_dryer", section: "closing" },
  { key: "clean_workspace", section: "closing" },
  { key: "sweep_mop_kiosk", section: "closing" },
  { key: "collect_dirty_hoods", section: "closing" },
  { key: "clean_pizza_machine", section: "closing" },
  { key: "cash_closing", section: "closing" },
];

export const TOTAL_ITEMS = CHECKLIST_ITEMS.length;
