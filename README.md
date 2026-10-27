# SkyStudio 360°

**Procedural 360° sky in the browser** — 12 physically motivated cloud types, day / sunset / night, solar and lunar eclipses, aircraft with three contrail regimes, cloud brushes, and export of seamless equirectangular panoramas (2:1 PNG) for skyboxes and 3D scenes.

[Русская версия](README.ru.md)

![Sunset cloud rolls, 360° equirectangular export](docs/panorama-sunset.jpg)
![Cumulus field, 360° equirectangular export](docs/panorama-cumulus.jpg)

*Both images are unedited 360° panoramas exported with the 💾 PNG button.*

## Try it

- **Online:** `https://rostislav-kr.github.io/skystudio-360/` (after GitHub Pages is enabled for this repository)
- **Offline:** download [`dist/skystudio-360.html`](dist/skystudio-360.html) and open it by double-click — everything is in one file.

The interface is available in Russian and English (🌐 button, or `?lang=en` / `?lang=ru` in the URL).

## What it does

| | |
|---|---|
| **12 cloud types** | Cirrus fibratus, uncinus, vertebratus, cumulus humilis and congestus, cirrocumulus, altocumulus floccus / lacunosus / undulatus, two-layer skies, cumulonimbus with rain shafts and lightning, contrail corridors |
| **24 presets** | Ready-made scenes (cloud type + time of day + Sun/Moon), nine of them tuned against reference sky photographs |
| **Light** | HDR solar glare with Mie corona, crepuscular rays, Sun transillumination through thin clouds, silver linings |
| **Night** | Starfield and Milky Way, Moon with phases and lunar corona, Blood Moon, total solar eclipse with corona and prominences |
| **Aircraft** | Twin-jet, four-engine jumbo, supersonic delta; contrails at 11.2 / 7.8 / 4.2 km behave differently (persistent cirrus plume, vortex trail, fast-evaporating trail) |
| **Physics panel** | LCL, EL, CAPE and wind shear for each cloud type with a mini T(z) sounding; evolution modes (birth & decay, atlas, 24 h cycle, frontal passage) |
| **Editing** | Cirrus / cumulus / cirrocumulus brushes in three modes (light, volumetric, densifying), soft eraser, dragging the Sun, Moon and wind |
| **Export** | 2560×1280 equirectangular PNG — usable as a skybox / environment background in Blender, Unity, Godot, three.js |

## How it works

All clouds are computed in a single GLSL fragment shader from analytic noise (FBM and C²-smooth "billow" noise), with no textures except a procedurally generated Moon map.

To keep looking around at 60 FPS, the 360° cloud dome is **baked** once into a 2048×1024 render target (density, slope, detail, shadow) and the per-frame pass only does lighting, Sun/Moon, stars, aircraft and rain on top of it. The dome is re-baked only when the cloud shape changes. Baking can be switched off (🔥) to evaluate every noise octave every frame.

```
src/
  main.js            entry point, animation loop, evolution modes
  renderer.js        WebGL setup, dome baking, uniforms, PNG export
  shaders/sky.js     the fragment shader + derivation of the bake / fast passes
  ui.js              buttons, sliders, preset library, physics panel, pointer input
  paint.js           spherical paint map for brushes and eraser
  moon.js            procedural Moon albedo map
  state.js           application state, Sun/Moon geometry, flight paths
  i18n.js            Russian / English strings
  data/species.js    cloud types with physical parameters
  data/themes.js     presets
```

## Development

Requires Node.js 18+.

```bash
npm install
npm run dev      # serves the folder at http://localhost:5173
npm run build    # writes dist/skystudio-360.html — a single self-contained file
```

The modular version (`index.html`) loads three.js from `vendor/` via an import map and needs to be served over HTTP (opening it by double-click redirects to the standalone build). The standalone build bundles everything with esbuild, so it works offline.

## Roadmap

- HDR (`.hdr` / `.exr`) and cubemap export for image-based lighting
- Shareable links with all parameters in the URL
- 4K / 8K export
- A reusable `CloudSky` component for three.js scenes

Issues and pull requests are welcome.

## License

[MIT](LICENSE) © Rostislav-Kr. three.js (`vendor/`) is MIT-licensed by its authors, see `vendor/three.LICENSE`.
