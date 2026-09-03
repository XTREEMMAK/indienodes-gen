import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { load as parseYaml } from "js-yaml";

/**
 * One record per directory under `src/creators/`. Each directory is
 * `<slug>/creator.yaml` plus that creator's own `assets/`; this file loads
 * and parses every `creator.yaml` it finds and returns them as a plain
 * array, sorted by slug for a stable, reviewable build order.
 *
 * Deliberately not an Eleventy paired-data / directory-data convention
 * (`creators.11tydata.js` per folder): with a handful of creators, one loader
 * that lists what exists is easier to reason about than per-folder magic,
 * and it's the natural place to enforce shape rules later (a missing
 * `type`, an unknown skin) without touching every template that reads
 * creator data.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREATORS_DIR = path.join(__dirname, "..", "creators");

const VALID_TYPES = ["audio", "comic", "text", "game", "art"];

export default function () {
  const selection = process.env.INDIENODES_BUILD_CREATOR;
  if (!selection) {
    throw new Error(
      "No creator selected. Use `npm run build -- --creator <slug>` or `npm run build:all`.",
    );
  }

  if (!existsSync(CREATORS_DIR)) return [];

  return readdirSync(CREATORS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => selection === "*" || entry.name === selection)
    .map((entry) => entry.name)
    .sort()
    .map((slug) => {
      const file = path.join(CREATORS_DIR, slug, "creator.yaml");
      const record = parseYaml(readFileSync(file, "utf8"));

      if (record.slug && record.slug !== slug) {
        throw new Error(
          `src/creators/${slug}/creator.yaml declares slug "${record.slug}", which must match its directory name.`,
        );
      }
      if (!VALID_TYPES.includes(record.type)) {
        throw new Error(
          `src/creators/${slug}/creator.yaml has type "${record.type}"; must be one of ${VALID_TYPES.join(", ")}.`,
        );
      }

      return { ...record, slug };
    });
}
