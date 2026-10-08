# Module OpenStreetMap for Divi 5

Native Divi 5 module to add interactive OpenStreetMap maps (Leaflet) to your pages, with custom markers, Custom Post Type support and a sliding sidebar.

> Divi 5 only. There is no Divi 4 / shortcode compatibility mode.

## Features

- **OpenStreetMap** map module with a **Pin** child module (one Pin = one marker)
- Markers placed manually and/or generated automatically from a Custom Post Type (post type, taxonomy and term filters)
- 100+ predefined marker icons, or a custom icon by URL
- Marker clustering, location search (geocoding), minimap, user geolocation, base layer switcher, "reset view" button
- Marker content in a classic popup or in a customizable sliding sidebar, per map, with per-marker style overrides
- Live map preview in the Visual Builder
- Fully translatable, French included

## Requirements

- WordPress 6.9+
- PHP 8.1+
- Divi 5 (theme or builder)

## Installation

1. Download the latest release ZIP from the [Releases](https://github.com/restezconnectes/d5-module-openstreetmap/releases) page (or clone this repository into `wp-content/plugins/d5-module-openstreetmap`).
2. Activate **Module OpenStreetMap for Divi 5** in *Plugins*.
3. Add the **OpenStreetMap** module in the Divi 5 Visual Builder.

`scripts/bundle.js` (the Visual Builder bundle) is committed on purpose, so a plain clone works without a build step.

## Development

```bash
npm install
npm run build   # production build -> scripts/bundle.js
npm run start   # watch mode
```

Rebuild and commit `scripts/bundle.js` whenever you change anything in `src/`.

Structure:

- `d5-module-openstreetmap.php`: plugin bootstrap
- `includes/`: PHP side (module classes, rendering, styles, i18n)
- `includes/modules/*/module.json`: module definitions, shared by PHP and the Visual Builder
- `src/`: TypeScript/React sources for the Visual Builder
- `assets/`: front-end scripts, styles and marker icons
- `languages/`: `.pot` template and French translation

See `readme.txt` for translation notes.

## Third-party libraries

Bundled in `assets/`:

| Library | Version | License |
|---|---|---|
| [Leaflet](https://leafletjs.com) | 1.5.1 | BSD-2-Clause |
| [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | | MIT |
| [Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) | | BSD-2-Clause |
| [Esri Leaflet](https://github.com/Esri/esri-leaflet) / [Esri Leaflet Geocoder](https://github.com/Esri/esri-leaflet-geocoder) | 2.2.14 | Apache-2.0 |

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Geocoding uses the Esri ArcGIS World Geocoding service; check its terms of use for your site.

## License

GPL v2 or later. See [LICENSE](LICENSE).

© 2026 Florent Maillefaud, [restezconnectes.fr](https://restezconnectes.fr)
