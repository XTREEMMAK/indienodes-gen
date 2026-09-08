# Dust particles (prototype)

Include `dust.css` and deferred `dust.js` in a preview, then add:

```html
<canvas class="dust-particles" aria-hidden="true"></canvas>
<button class="dust-particles-toggle" hidden type="button" aria-pressed="false">
  Pause dust
</button>
```

Page content should be inside `.page`, which the feature positions above the
canvas. The overlay does not intercept clicks. Small motes drift slowly
upward with a gentle sideways wobble and twinkle in opacity, capped around
50 motes on large screens. The effect honors reduced motion and pauses in
hidden tabs.

Inspired by https://codepen.io/BrendonC/pen/EeajOe.

This feature is independent of `../cherry-blossoms/` and can be combined with
it or used alone. See `../../README.md` for the promotion workflow.
