# Cherry blossoms (prototype)

Include `blossoms.css` and deferred `blossoms.js` in a preview, then add:

```html
<canvas class="blossoms" aria-hidden="true"></canvas>
<button class="blossoms-toggle" hidden type="button" aria-pressed="false">
  Pause petals
</button>
```

Page content should be inside `.page`, which the feature positions above the
canvas. The overlay does not intercept clicks. The effect honors reduced
motion, pauses in hidden tabs and limits density to 18 petals.

Jewel's preview demonstrates this opt-in. Production enables this through `theme.effects.cherryBlossoms: true`; see `../../README.md` for the promotion workflow.
