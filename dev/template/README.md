# `dev/template/` — HTML prototype

This is where the page design gets settled before any of it goes through
Eleventy. Plain HTML and CSS, no build step, no dependencies — open
`index.html` directly with `file://` in a browser.

It is hardcoded to one sample creator (Jewel, `audio` type, three tracks) on
purpose. There is no data file here and no templating; every value you see is
literally in the markup. That is deliberate — this is the prototype, not the
build, and the point is to argue about layout and CSS without a template
engine in the way.

## What's real here

- `css/base.css` — tokens, reset, and every section's structure. Skin-
  independent: a page linking only this file is complete and usable.
- `css/skins/card.css` — the default skin, layered on top of `base.css`.
  A skin is a stylesheet only; it never introduces markup or classes that
  `base.css` doesn't already provide.
- `css/fonts.css` + `fonts/*.woff2` — the two self-hosted variable fonts
  (Space Grotesk, Karla), copied by value from `indienodes-web`.
- The ring embed and verification meta tag in `index.html`'s `<head>` and
  `<footer>` are the real snippets from `indienodes-app`'s widget (the
  default `widget` tier, a sandboxed iframe) — not placeholders to be
  designed later.
- `js/reveal.js` — intro animation for each top-level section (fade-rise by
  default, sequenced across the hero and grouped section content). Progressive
  enhancement: the hidden pre-animation state only applies under a `.has-js`
  class the script itself adds as its first line, so a page with JS blocked or
  failing shows every section plainly rather than stuck invisible. Honors
  `prefers-reduced-motion` both in the script (skips the observer entirely)
  and in `base.css` (forces the visible end-state as a backstop).
- `assets/` — placeholder media only: two generated SVGs standing in for a
  profile photo and a background image, and three generated tone `.wav`
  files standing in for tracks. None of it is meant to look or sound good;
  it exists so the layout has something real to lay out.

## What happens next

Once this reads right in both themes, at narrow and wide viewports, and with
reduced motion on:

1. `css/base.css` and `css/skins/card.css` move byte-for-byte into
   `src/assets/css/`.
2. `index.html`'s markup becomes `src/_includes/layouts/page.njk`, with
   hardcoded values swapped for Nunjucks expressions reading from a
   creator's YAML record.
3. The per-type work modules (`art`, `comic`, `text`, `game`) that this
   prototype's CSS already accounts for (see `.gallery`, `.pages`,
   `.excerpt`, `.game__cover` in `base.css`) get their own markup partials,
   proven against a second, differently-typed creator.

See the project plan for the full Eleventy scaffold this feeds into.
