#!/usr/bin/env node
/**
 * Concatène toutes les migrations SQL (supabase/migrations/*.sql) en un
 * seul fichier `supabase/migrations/_all.sql` que tu peux coller tel quel
 * dans le SQL Editor de Supabase.
 *
 * Usage:
 *   node scripts/build-all-migrations.mjs
 *   npm run db:bundle
 *
 * Conçu pour les déploiements neufs (premier setup) ou pour repartir d'une
 * DB vierge. Les migrations sont idempotentes (CREATE IF NOT EXISTS, etc.)
 * donc relancer le bundle complet sur une DB déjà migrée est sans danger.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const MIG_DIR = join(ROOT, "supabase", "migrations");
const OUT = join(MIG_DIR, "_all.sql");

const files = readdirSync(MIG_DIR)
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("Aucune migration trouvée dans", MIG_DIR);
  process.exit(1);
}

const parts = [
  "-- =====================================================================",
  "-- Bundle de toutes les migrations Supabase pour app-notification.",
  "-- Généré automatiquement par scripts/build-all-migrations.mjs",
  `-- Date: ${new Date().toISOString()}`,
  `-- Migrations incluses: ${files.length}`,
  "--",
  "-- USAGE : copier-coller ce fichier entier dans le SQL Editor de Supabase",
  "-- (Dashboard → SQL Editor → New query → coller → Run).",
  "-- Idempotent: peut être réexécuté sans dommage sur une DB déjà migrée.",
  "-- =====================================================================",
  "",
];

for (const f of files) {
  const content = readFileSync(join(MIG_DIR, f), "utf-8");
  parts.push(
    "",
    "-- ---------------------------------------------------------------------",
    `--  ${f}`,
    "-- ---------------------------------------------------------------------",
    "",
    content.trim(),
    "",
  );
}

writeFileSync(OUT, parts.join("\n"), "utf-8");

const sizeKb = (Buffer.byteLength(parts.join("\n"), "utf-8") / 1024).toFixed(1);
console.log(`✓ Bundle créé : ${OUT}`);
console.log(`  ${files.length} migrations · ${sizeKb} Ko`);
console.log("");
console.log("Étapes :");
console.log("  1. Ouvre supabase/migrations/_all.sql");
console.log("  2. Sélectionne tout (Ctrl+A) et copie (Ctrl+C)");
console.log("  3. Dans Supabase → SQL Editor → New query → colle → Run");
