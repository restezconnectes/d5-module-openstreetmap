=== Module OpenStreetMap for Divi 5 ===
Contributors: Florent73
Tags: divi, divi-5, openstreetmap, maps, leaflet
Requires at least: 6.9
Tested up to: 7.1
Stable tag: 1.0.0
Requires PHP: 8.1
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add interactive OpenStreetMap maps with custom markers, Custom Post Type support, and a sliding sidebar — a native Divi 5 module.

== Description ==

This plugin adds a native **OpenStreetMap** module (with an **Pin** child module) to the
Divi 5 Visual Builder. It supports:

* Maps with multiple markers, placed manually (Pin modules) and/or generated automatically
  from a Custom Post Type
* Automatic clustering of nearby markers
* Over 100 predefined marker icons, or a custom icon by URL
* Location search (geocoding), minimap, user geolocation, base layer switcher, and a
  "reset view" button
* Marker content shown in a classic popup bubble **or** in a customizable sliding sidebar
  (colors, "Read More" button), per map
* Each manually placed marker can individually override the sidebar style
* A location search field on the Pin module to automatically fill in its coordinates
* Live map preview directly in the Visual Builder (not a static placeholder)
* Full translation support (front-end and Visual Builder settings panel) — French
  translation included
* 100% native Divi 5 integration (no legacy/shortcode mode)

This plugin is specific to Divi 5 and has no Divi 4 compatibility mode.

== Installation ==

1. Upload the `d5-module-openstreetmap` folder to the `/wp-content/plugins/` directory, or
   install the plugin directly through the WordPress plugins screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Use the "OpenStreetMap" module in the Divi 5 Visual Builder.

== Frequently Asked Questions ==

= Does this plugin work with Divi 4? =

No. This plugin is built entirely on the Divi 5 module API and registers no Divi 4
shortcode module. For Divi 4, a separate, dedicated plugin is required.

= Can I display markers from a Custom Post Type automatically? =

Yes. Enable "Custom Post Type Markers" in the module's Content settings, choose the post
type, and optionally filter by taxonomy and terms. Coordinates are read from post meta
(`{post_type}_latitude`/`{post_type}_longitude`, a generic `coordinates` field, or plain
`latitude`/`longitude` meta).

= Can each marker look different? =

Yes. Each manually placed Pin module has its own icon, popup/sidebar content, and can
override the sidebar's colors independently of the map's own settings.

== Screenshots ==

1. The OpenStreetMap module settings panel in the Divi 5 Visual Builder.
2. A map with multiple markers and the base layer switcher.
3. Marker content shown in the sliding sidebar.

== Changelog ==

= 1.0.0 =

* Initial release.
* OpenStreetMap (map) and Pin (marker) modules, 100% native to Divi 5.
* Manually placed markers (Pin modules) and/or markers generated automatically from a
  Custom Post Type (post type, taxonomy, and term filtering).
* Over 100 predefined marker icons, or a custom icon by URL.
* Automatic clustering of nearby markers.
* Location search (geocoding), minimap, user geolocation, base layer switcher, and a
  "reset view" button.
* Marker content can be shown in a classic popup bubble or in a customizable sliding
  sidebar ("Read More" button), selectable per map.
* Sidebar style customizable per map, with an optional override per marker (background,
  text, and button: background, border, border width, text).
* A location search field on the Pin module, to automatically fill in its coordinates from
  a selected search result.
* Live map preview in the Visual Builder (markers, base layers, controls).
* Full translation support (front-end and Visual Builder settings panel) — French
  translation included.

== Upgrade Notice ==

= 1.0.0 =

Initial release.

== Other Notes ==

= Development =

The Visual Builder settings panel (module icon, fields, live preview) is built from `src/`
via webpack, into `scripts/bundle.js`. This file ships with the plugin; only rebuild it if
you change the source in `src/`.

`cd d5-module-openstreetmap && npm install && npm run build` (production build, writes
`scripts/bundle.js`), or `npm run start` for development mode (rebuilds on every change).

Modules follow the standard Divi 5 structure: a `module.json` (read by PHP for front-end
rendering, and imported directly by `src/index.ts` at build time for the Visual Builder
panel), a `*Module.php` class implementing `DependencyInterface`, and `*ModuleTrait/`
traits for rendering, styles, classnames, and script data.

= Translations =

Text domain: `d5-module-openstreetmap`. French (`fr_FR`) ships by default in `languages/`.

* Front-end strings (PHP rendering, map init script) use standard `__()`/`esc_html__()`,
  loaded via `load_plugin_textdomain()`.
* `module.json` labels/descriptions used by PHP rendering are translated by
  `includes/ModuleI18n.php`, hooked on the `block_type_metadata` core filter.
* The Visual Builder settings panel consumes `module.json` directly in JavaScript,
  independently of the PHP filter above. `src/i18n-metadata.ts` re-translates the same
  metadata client-side via `src/translate.ts`, reading a dictionary built from the already
  loaded `.mo` file and handed to the Visual Builder's app window through Divi's own
  `data_app_window` mechanism (see `register_vb_assets()` in `D5ModuleOpenstreetmap.php`,
  read client-side by `src/vb-data.ts`).

To add a language: duplicate `languages/d5-module-openstreetmap.pot`, translate it (Poedit
or similar), save it as `d5-module-openstreetmap-{locale}.po`, then compile the `.mo`
(`msgfmt`). Do not run Poedit's "Update from source" on this file — it only detects literal
`__()` calls and would drop most of the strings, which are translated dynamically from
`module.json`.
