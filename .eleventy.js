import { load as parseYaml } from "js-yaml";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const CREATORS_DIR = "src/creators";
const CREATOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getBuildCreatorSlugs() {
  const selection = process.env.INDIENODES_BUILD_CREATOR;

  if (!selection) {
    throw new Error(
      "No creator selected. Use `npm run build -- --creator <slug>` or `npm run build:all`.",
    );
  }

  if (selection === "*") {
    return readdirSync(CREATORS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  }

  if (!CREATOR_SLUG_PATTERN.test(selection)) {
    throw new Error(`Invalid creator build selection "${selection}".`);
  }

  return [selection];
}

export default function (eleventyConfig) {
  const creatorSlugs = getBuildCreatorSlugs();
  const buildAll = process.env.INDIENODES_BUILD_CREATOR === "*";
  eleventyConfig.addGlobalData("buildAll", buildAll);
  eleventyConfig.addGlobalData("publicRoot", buildAll ? "/" : "");
  eleventyConfig.addGlobalData(
    "assetRoot",
    buildAll ? "/assets" : "assets/shared",
  );
  eleventyConfig.addFilter("socialIcon", (label) => {
    const key = String(label || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const icons = {
      bandcamp: "bandcamp",
      youtube: "youtube",
      facebook: "facebook",
      spotify: "spotify",
      bluesky: "bluesky",
      discord: "discord",
      twitter: "x-twitter",
      x: "x-twitter",
      twitterx: "x-twitter",
      soundcloud: "soundcloud",
      artstation: "artstation",
      instagram: "instagram",
      applemusic: "applemusic",
      email: "email",
      cv: "cv",
    };
    return Object.hasOwn(icons, key) ? icons[key] : "";
  });
  // Inline only our bundled SVGs, never arbitrary YAML paths or markup.
  const iconNames = new Set(
    readdirSync("src/assets/icons").filter((name) => name.endsWith(".svg")),
  );
  eleventyConfig.addFilter("socialSvg", (icon) => {
    const filename = `${icon}.svg`;
    if (!iconNames.has(filename)) return "";
    return readFileSync(`src/assets/icons/${filename}`, "utf8").replace(
      "<svg ",
      '<svg class="social-icon" aria-hidden="true" focusable="false" ',
    );
  });
  // Allow emphasis in biographies without accepting arbitrary HTML.
  eleventyConfig.addFilter("bioText", (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"),
  );

  eleventyConfig.addDataExtension("yaml", (contents) => parseYaml(contents));

  // Used once, in layouts/page.njk, to gate a creator's inline accent
  // override on a strict hex value before it's ever interpolated into a
  // <style> block.
  eleventyConfig.addFilter("regexMatch", (value, pattern) =>
    new RegExp(pattern).test(value),
  );

  // The ring's "selected works" cap — tracks/pages/artworks/excerpts are all
  // capped at 3 (indienodes-ring: "a sampler, not a full catalog host").
  // Enforced here, in the template layer, rather than trusted to whoever
  // edits a creator's YAML.
  eleventyConfig.addFilter("capped", (list, n) => (list || []).slice(0, n));

  // Distinguishes excerpts[]'s two ring-schema shapes: an object
  // ({title?, text, audio_url?}) or a bare legacy string. Nunjucks has no
  // built-in typeof check.
  eleventyConfig.addFilter("isString", (value) => typeof value === "string");

  eleventyConfig.addPassthroughCopy({
    "src/assets": buildAll ? "assets" : "assets/shared",
  });
  // Creator media stays relative to its page: root for standalone builds,
  // <slug>/ for multi-creator deployments. Shared assets have a separate
  // namespace in standalone output to prevent media filename collisions.
  for (const slug of creatorSlugs) {
    const assetsDir = `${CREATORS_DIR}/${slug}/assets`;
    if (existsSync(assetsDir)) {
      if (!buildAll && existsSync(`${assetsDir}/shared`)) {
        throw new Error(
          "Creator assets/shared is reserved for shared template assets in standalone builds.",
        );
      }
      eleventyConfig.addPassthroughCopy({
        [assetsDir]: buildAll ? `${slug}/assets` : "assets",
      });
    }
  }
  eleventyConfig.addPassthroughCopy({ "src/favicon-16.png": "favicon-16.png" });
  eleventyConfig.addPassthroughCopy({ "src/favicon-32.png": "favicon-32.png" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
