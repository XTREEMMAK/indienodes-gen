# Animated waves

Enable the generated background with `theme.effects.waves: true` in a
creator's YAML. Omit it or set it to false to disable the feature.
George's profile enables it. Wave colors follow `theme.accent`.

For a hand-authored preview, include `waves.css` and deferred `waves.js`,
copy the SVG from `waves.html` before `.page`, and add this button to the
existing effects drawer:

```html
<button class="waves-toggle" hidden type="button" aria-pressed="false">Pause waves</button>
```

Use the shared template styles, which position `.page` above the background.
The four layers drift at different speeds and stay fixed behind content.
Pause freezes the waves in place; resume continues their motion. Hidden
browser tabs pause automatically. Reduced motion keeps a static background
and hides the pause button, including when JavaScript is unavailable.

Production copies live in `src/assets/css/waves.css`, `src/assets/js/waves.js`,
and `src/_includes/components/waves.njk`. Keep these copies in sync.
See `waves-NOTICE.txt` for the original example and attribution.

Optional soft edges: set `theme.effects.wavesBlur: true` alongside `waves: true`.
This applies an 8px blur to the background only. Omit it or set it to false
for crisp waves. George's profile enables both settings.

```yaml
theme:
  effects:
    waves: true
    wavesBlur: true
```

For a hand-authored preview, add `waves-background--blur` to the SVG's
`class` attribute in `waves.html`. The preview SVG stays crisp by default;
the generated component adds that class from the YAML setting.

The wave path extends one extra repeat beyond each side so the animation
and blur never reveal its vertical ends. The drift spans exactly 176 SVG
units, matching one full wave repeat for a seamless loop.
