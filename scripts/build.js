import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";
import { zipDirectory } from "./zip.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const creatorsDir = path.join(projectRoot, "src", "creators");
const outputDir = path.join(projectRoot, "_site");
const distDir = path.join(projectRoot, "dist");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const audioPattern = /\.(?:aac|flac|m4a|mp3|ogg|opus|wav)$/i;

function fail(message) {
  console.error(`Build error: ${message}`);
  process.exit(1);
}

function parseArguments(args) {
  let creator;
  let all = false;
  let serve = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--creator") {
      creator = args[index + 1];
      index += 1;
    } else if (argument === "--all") {
      all = true;
    } else if (argument === "--serve") {
      serve = true;
    } else {
      fail(`unknown argument "${argument}".`);
    }
  }

  if (all && creator) {
    fail("use either --creator <slug> or --all, not both.");
  }

  if (!all && !creator) {
    fail(
      "a creator is required. Use `npm run build -- --creator <slug>` or explicitly run `npm run build:all`.",
    );
  }

  if (creator && !slugPattern.test(creator)) {
    fail(`invalid creator slug "${creator}".`);
  }

  return { all, creator, serve };
}

function getCreatorSlugs(selection) {
  if (selection.all) {
    return readdirSync(creatorsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  }

  return [selection.creator];
}

function isExternalReference(reference) {
  return (
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(reference) ||
    reference.startsWith("data:")
  );
}

function resolveLocalReference(creatorDir, reference) {
  const cleanReference = reference.split(/[?#]/, 1)[0];

  if (cleanReference.startsWith("/")) {
    return path.join(projectRoot, "src", cleanReference.slice(1));
  }

  return path.resolve(creatorDir, cleanReference);
}

function validateCreator(slug) {
  const creatorDir = path.join(creatorsDir, slug);
  const dataFile = path.join(creatorDir, "creator.yaml");

  if (!existsSync(dataFile)) {
    fail(
      `creator "${slug}" does not have ${path.relative(projectRoot, dataFile)}.`,
    );
  }

  const creator = parseYaml(readFileSync(dataFile, "utf8"));
  const audioReferences = [
    ...(creator.tracks || []).map((track) => track?.media_url),
    ...(creator.excerpts || []).map((excerpt) =>
      typeof excerpt === "object" ? excerpt?.audio_url : undefined,
    ),
  ].filter(Boolean);

  for (const reference of audioReferences) {
    const pathWithoutQuery = reference.split(/[?#]/, 1)[0];
    if (isExternalReference(reference) || !audioPattern.test(pathWithoutQuery))
      continue;

    const audioFile = resolveLocalReference(creatorDir, reference);
    if (!existsSync(audioFile)) {
      fail(
        `creator "${slug}" is missing local audio ${path.relative(projectRoot, audioFile)}. Restore it before building locally.`,
      );
    }
  }
}

const selection = parseArguments(process.argv.slice(2));
const creatorSlugs = getCreatorSlugs(selection);

if (!creatorSlugs.length) {
  fail("no creator directories were found.");
}

creatorSlugs.forEach(validateCreator);

// Both the data loader and passthrough-copy configuration read this. An
// unset value is deliberately an error, so bypassing this wrapper cannot
// silently turn a single-creator build into a full-site build.
process.env.INDIENODES_BUILD_CREATOR = selection.all ? "*" : selection.creator;

// A creator-specific build must not leave another creator's files behind
// from an earlier run. Keep this exact and fail if the invariant changes.
if (
  path.dirname(outputDir) !== projectRoot ||
  path.basename(outputDir) !== "_site"
) {
  fail("refusing to clean an unexpected output directory.");
}
rmSync(outputDir, { force: true, recursive: true });

process.chdir(projectRoot);
const { default: Eleventy } = await import("@11ty/eleventy");
const eleventy = new Eleventy("src", "_site", {
  configPath: ".eleventy.js",
  runMode: selection.serve ? "serve" : "build",
});

if (selection.serve) {
  // Unlike write(), the programmatic watch path expects the same explicit
  // initialization that Eleventy's own CLI performs before calling watch().
  await eleventy.init();
  await eleventy.watch();
  await eleventy.serve();

  process.on("SIGINT", async () => {
    await eleventy.stopWatch();
    process.exitCode = 0;
  });
} else {
  await eleventy.write();
  console.log(
    selection.all
      ? "Built all creators into _site/."
      : `Built creator "${selection.creator}" into _site/${selection.creator}/.`,
  );

  // A single-creator build's _site/ is already scoped to just that creator
  // (their own folder plus the shared chrome assets needed to render it —
  // see getBuildCreatorSlugs in .eleventy.js), so the whole directory is
  // exactly the self-contained bundle for them. --all has no one creator to
  // name the archive after, so it's left as a plain directory for KJNet's
  // own deployment process instead.
  if (!selection.all) {
    mkdirSync(distDir, { recursive: true });
    const zipPath = path.join(distDir, `${selection.creator}.zip`);
    zipDirectory(outputDir, zipPath);
    console.log(
      `Zipped it to ${path.relative(projectRoot, zipPath)}.`,
    );
  }
}
