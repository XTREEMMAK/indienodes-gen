import { load as parseYaml } from "js-yaml";
import { existsSync, readdirSync } from "node:fs";

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

  eleventyConfig.addPassthroughCopy("src/assets");
  // Ships each creator's own assets alongside their page, so `_site/<slug>/`
  // is a self-contained folder: `assets/profile.webp` inside creator.yaml
  // resolves relatively and the whole folder can be handed to the creator
  // or moved to another host without touching a path.
  // Copy only assets, never creator.yaml. The normal build wrapper narrows
  // this list to the requested creator before Eleventy starts.
  for (const slug of creatorSlugs) {
    const assetsDir = `${CREATORS_DIR}/${slug}/assets`;
    if (existsSync(assetsDir)) {
      eleventyConfig.addPassthroughCopy({ [assetsDir]: `${slug}/assets` });
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
