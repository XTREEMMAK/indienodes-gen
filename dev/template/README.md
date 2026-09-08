# Shared design baseline

This neutral sample audio page demonstrates the common layout, social links,
waveform player and reveal animation. Jewel's individual design now lives in
[`../creators/jewel/`](../creators/jewel/README.md).

Serve from the repository root:

```sh
python3 -m http.server 8080 --directory dev
```

Open http://localhost:8080/template/ for the baseline or
http://localhost:8080/creators/jewel/ for Jewel.

Shared assets live here so creator previews can reference them without
copying CSS, fonts or JavaScript. The profile/background SVGs and tone WAVs
are placeholders. Social links are platform homepages, not creator profiles.

Brand icons are Font Awesome Free 7.3.1; see `assets/icons/LICENSE.txt`.
WaveSurfer 7.12.11 is self-hosted with its BSD license in `js/vendor/`.
It decodes actual audio, retains native controls and requires HTTP for waves.
Remote audio needs CORS access; file URLs retain basic native playback.

The baseline has no cherry blossom or dust particle effect. Optional effects
live in `../features/` and creator-specific overrides beside their previews.
See [the development workflow](../README.md) for promoting approved changes
into the generated template. Social icons, waveforms, cosplay tabs, the
optional blossom/dust effects, and the site-controls background-reveal +
effects drawer are also supported by the generated template.

Defaults: blurred glass panels, a left-aligned Elsewhere heading with centered
links, and smooth transitions whenever tabs are present. Generated pages can
opt out of glass with `theme.glassPanels: false`.

The default footer places the creator’s own site on the first text line and
the hosting credit on the second, with compact line spacing. The generated
template omits the first line when no `source_url` is supplied.
