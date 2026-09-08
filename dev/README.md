# Design development

Serve the entire dev directory from the repository root:

```sh
python3 -m http.server 8080 --directory dev
```

- Shared baseline: http://localhost:8080/template/
- Jewel's preview: http://localhost:8080/creators/jewel/

Serve `dev/`, not an individual preview directory: creator pages reference
shared assets through relative URLs. HTTP is needed for waveform decoding.

## Where changes belong

- `template/`: baseline HTML, shared CSS, fonts, brand icons, sample audio,
  reveal animation and waveform player. Changes here can affect all previews.
- `creators/<slug>/`: independent preview markup, creator artwork and a local
  override stylesheet. Jewel's ongoing design work belongs here.
- `features/<name>/`: optional reusable effects with their own CSS and JS.
  A preview opts in by including the feature's assets and required markup.

Only preview HTML is copied per creator. Reference shared assets instead of
forking base styles or scripts. Sample tone files remain shared; add real
creator media to their preview's assets directory when available.

## Promoting an approved design

1. Review the creator preview at narrow/wide widths and with reduced motion.
2. Move approved shared styles/scripts to `src/assets/`; adapt markup into
   `src/_includes/` components or the shared layout.
3. For optional features, add a YAML setting and conditional asset/markup
   inclusion. Creator-only media belongs in `src/creators/<slug>/assets/`.
4. Enable the feature in the appropriate creator YAML and build that creator.
   Check that creators omitting the setting retain the baseline behavior.

Promotion is deliberate, not an automatic folder copy: dev HTML is hardcoded
and generated pages use Nunjucks. No post-build edits or creator-name checks
are needed. A dev preview does not change production on its own.
