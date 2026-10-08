<?php
/**
 * D5 Module OpenStreetMap - Classe principale
 *
 * @package D5OSM
 * @since 1.0.0
 */

namespace D5OSM;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use ET\Builder\Framework\DependencyManagement\Interfaces\DependencyInterface;
use ET\Builder\Framework\DependencyManagement\DependencyTree;

/**
 * Classe principale de l'extension Divi 5 OpenStreetMap
 *
 * @since 1.0.0
 */
class D5ModuleOpenstreetmap implements DependencyInterface {

	/**
	 * Flag pour éviter le chargement multiple
	 *
	 * @var bool
	 */
	private static $loaded = false;

	/**
	 * Charge le module
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load(): void {
		// Éviter le chargement multiple
		if ( self::$loaded ) {
			return;
		}
		self::$loaded = true;

		// Enregistrer les assets d'abord
		$this->register_assets();

		// Charger les modules
		require_once D5_OSM_PATH . 'includes/modules/OpenStreetMap/OpenstreetmapModule.php';
		require_once D5_OSM_PATH . 'includes/modules/OpenStreetMapPin/OpenstreetmapPinModule.php';

		$openstreetmap_module = new \D5OSM\Modules\OpenStreetMap\OpenstreetmapModule();
		$openstreetmap_module->load();

		$pin_module = new \D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModule();
		$pin_module->load();

		// Enregistrer les assets JavaScript pour le Visual Builder
		$this->register_vb_assets();

		// Enqueue les assets
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ], 20 );
		add_action( 'et_fb_enqueue_assets', [ $this, 'enqueue_assets' ], 20 );
	}

	/**
	 * Enregistre les scripts et styles
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function register_assets(): void {
		// Leaflet CSS
		wp_register_style(
			'd5_osm_leaflet_css',
			D5_OSM_URL . 'assets/styles/leaflet.min.css',
			[],
			D5_OSM_VERSION
		);

		// Leaflet JS
		wp_register_script(
			'd5_osm_leaflet_js',
			D5_OSM_URL . 'assets/scripts/leaflet.min.js',
			[ 'jquery' ],
			D5_OSM_VERSION,
			true
		);

		// Marker Cluster CSS
		wp_register_style(
			'd5_osm_markercluster_css',
			D5_OSM_URL . 'assets/styles/MarkerCluster.min.css',
			[ 'd5_osm_leaflet_css' ],
			D5_OSM_VERSION
		);

		// Marker Cluster CSS (skin par défaut : couleur/forme des bulles de cluster).
		// Sans ce fichier, un cluster de 2+ marqueurs proches est ajouté au DOM
		// mais reste visuellement invisible (aucune couleur, aucun arrondi).
		wp_register_style(
			'd5_osm_markercluster_default_css',
			D5_OSM_URL . 'assets/styles/MarkerCluster.Default.css',
			[ 'd5_osm_markercluster_css' ],
			D5_OSM_VERSION
		);

		// Marker Cluster JS
		wp_register_script(
			'd5_osm_leaflet_clusterjs',
			D5_OSM_URL . 'assets/scripts/leaflet.markercluster.min.js',
			[ 'd5_osm_leaflet_js' ],
			D5_OSM_VERSION,
			true
		);

		// Esri Leaflet JS
		wp_register_script(
			'd5_osm_leaflet_esri_js',
			D5_OSM_URL . 'assets/scripts/esri-leaflet.min.js',
			[ 'd5_osm_leaflet_js' ],
			D5_OSM_VERSION,
			true
		);

		// Esri Geocoder CSS
		wp_register_style(
			'd5_osm_leafletgeocodertcss',
			D5_OSM_URL . 'assets/styles/esri-leaflet-geocoder.min.css',
			[ 'd5_osm_leaflet_css' ],
			D5_OSM_VERSION
		);

		// Esri Geocoder JS
		wp_register_script(
			'd5_osm_leafletgeocoderjs',
			D5_OSM_URL . 'assets/scripts/esri-leaflet-geocoder.js',
			[ 'd5_osm_leaflet_esri_js' ],
			D5_OSM_VERSION,
			true
		);

		// MiniMap CSS
		wp_register_style(
			'd5_osm_minimapcss',
			D5_OSM_URL . 'assets/styles/Control.MiniMap.css',
			[ 'd5_osm_leaflet_css' ],
			D5_OSM_VERSION
		);

		// MiniMap JS
		wp_register_script(
			'd5_osm_minimap',
			D5_OSM_URL . 'assets/scripts/Control.MiniMap.min.js',
			[ 'd5_osm_leaflet_js' ],
			D5_OSM_VERSION,
			true
		);

		// Nos propres surcharges par-dessus les CSS vendorisées (ex :
		// z-index manquant sur le dropdown de suggestions du géocodeur,
		// qui passait sous d'autres contrôles Leaflet).
		//
		// La librairie vendorisée "L.Control.Locate" (assets/styles/L.Control.Locate.min.css
		// + assets/scripts/L.Control.Locate.js) a été retirée en 1.9.0 : le bouton de
		// géolocalisation est maintenant un L.Control maison construit directement dans
		// d5osm-map-init.js (icône et comportement repris de
		// https://leaflet.restezconnectes.fr/#49.location-button), donc plus besoin de
		// cette dépendance.
		wp_register_style(
			'd5_osm_overrides_css',
			D5_OSM_URL . 'assets/styles/d5osm-overrides.css',
			[ 'd5_osm_leafletgeocodertcss' ],
			D5_OSM_VERSION
		);

		// Script d'initialisation des cartes
		wp_register_script(
			'd5_osm_map_init',
			D5_OSM_URL . 'assets/scripts/d5osm-map-init.js',
			[ 'd5_osm_leaflet_js', 'd5_osm_leaflet_clusterjs' ],
			D5_OSM_VERSION,
			true
		);

		// Localiser les variables JavaScript
		wp_localize_script(
			'd5_osm_map_init',
			'd5osm_vars',
			[
				'imagesUrl'          => D5_OSM_URL . 'assets/images/',
				// Last-resort fallback only: render_callback already resolves
				// a translated "Read More..." for every pin, this only covers
				// pin data built by hand outside of it.
				'defaultReadMoreText' => __( 'Read More...', 'd5-module-openstreetmap' ),
				'searchPlaceholder'  => __( 'Search for places or addresses', 'd5-module-openstreetmap' ),
				'homeButtonTitle'    => __( 'Reset view', 'd5-module-openstreetmap' ),
				'locateButtonTitle'  => __( 'Locate me', 'd5-module-openstreetmap' ),
				'locateErrorText'    => __( 'Location access denied.', 'd5-module-openstreetmap' ),
				// Leaflet's own L.Control.Zoom ships hard-coded English tooltips
				// ("Zoom in"/"Zoom out", baked into leaflet.min.js) — not reachable
				// by our module.json/.po translation system at all, since it never
				// goes through any of our own code. Overridden by passing our own
				// translated titles to L.control.zoom() instead of using the map's
				// automatic `zoomControl: true` option.
				'zoomInTitle'        => __( 'Zoom in', 'd5-module-openstreetmap' ),
				'zoomOutTitle'       => __( 'Zoom out', 'd5-module-openstreetmap' ),
				'closeSidebarLabel'  => __( 'Close', 'd5-module-openstreetmap' ),
			]
		);
	}

	/**
	 * Enregistre les assets JavaScript pour le Visual Builder
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function register_vb_assets(): void {
		// Enregistrer le bundle JavaScript pour le Visual Builder
		add_action(
			'divi_visual_builder_assets_before_enqueue_scripts',
			function() {
				if ( ! function_exists( 'et_builder_d5_enabled' ) || ! et_builder_d5_enabled() ) {
					return;
				}

				if ( ! function_exists( 'et_core_is_fb_enabled' ) || ! et_core_is_fb_enabled() ) {
					return;
				}

				$plugin_dir_url = D5_OSM_URL;
				$bundle_path    = D5_OSM_PATH . 'scripts/bundle.js';

				// Vérifier que le bundle existe
				if ( ! file_exists( $bundle_path ) ) {
					return;
				}

				if ( ! class_exists( '\ET\Builder\VisualBuilder\Assets\PackageBuildManager' ) ) {
					return;
				}

				// Données transmises à la fenêtre "app" du Visual Builder.
				//
				// On les passe directement en `data_app_window` (lu synchroniquement
				// par PackageBuildManager::enqueue_scripts() au moment même où il
				// enregistre notre script) plutôt qu'en faisant un `wp_localize_script()`
				// séparé sur le hook "after_enqueue_scripts" comme avant : ce second hook
				// générique se déclenche aussi bien pour la requête HTTP de la fenêtre du
				// haut que pour celle de la fenêtre app, et rien ne garantissait qu'il
				// s'exécutait après que WordPress ait déjà imprimé notre balise <script>
				// dans la bonne fenêtre — en pratique, aucune des variables (traductions,
				// types de CPT, endpoint de preview) n'atteignait jamais
				// `window` côté app, confirmé en console. `data_app_window` est le canal
				// officiel de Divi 5 pour ce cas précis (déjà utilisé en interne, ex. le
				// package `divi-settings`), donc fiable par construction.

				// Traductions JS (libellés/descriptions de module.json, chaînes de
				// edit.tsx — voir src/translate.ts). On charge notre .mo nous-mêmes,
				// pour la locale déterminée à CET instant précis, plutôt que de lire
				// `get_translations_for_domain()` (l'état global déjà chargé sur
				// `plugins_loaded`) : Divi appelle `switch_to_locale( $user_locale )`
				// juste avant d'enregistrer les package builds
				// (PackageBuildManager::register_divi_package_builds()) si la locale
				// de l'utilisateur diffère de celle du site — ce qui change la locale
				// active pour le reste de la requête SANS recharger automatiquement
				// les textdomains de plugins déjà chargés sous l'ancienne locale.
				// Résultat observé : `get_translations_for_domain()` retournait un
				// tableau vide dans la fenêtre app du Visual Builder (confirmé en
				// console), alors que le même appel fonctionne très bien côté
				// front-end (fenêtre unique, pas de changement de locale en cours de
				// requête).
				$translations_map = [];
				$mo_locale = determine_locale();
				$mo_file   = D5_OSM_PATH . 'languages/d5-module-openstreetmap-' . $mo_locale . '.mo';
				if ( file_exists( $mo_file ) ) {
					$mo = new \MO();
					if ( $mo->import_from_file( $mo_file ) ) {
						foreach ( $mo->entries as $entry ) {
							if ( ! empty( $entry->singular ) && ! empty( $entry->translations[0] ) ) {
								$translations_map[ $entry->singular ] = $entry->translations[0];
							}
						}
					}
				}

				// Options du select "Custom Post Type" (src/cpt-options.ts) — même
				// liste que le module Divi 4 : tous les post types publics, hors
				// types natifs (attachment/page/post).
				$post_types = get_post_types( [ 'public' => true ], 'objects' );
				$cpt_options = [];
				foreach ( $post_types as $post_type ) {
					if ( in_array( $post_type->name, [ 'attachment', 'page', 'post' ], true ) ) {
						continue;
					}
					$cpt_options[ $post_type->name ] = $post_type->labels->singular_name ?? $post_type->label;
				}

				// Options du select "Filter by Taxonomy" (src/cpt-options.ts) — même
				// liste que le module Divi 4 : toutes les taxonomies publiques non
				// natives, hors taxonomies internes de Divi.
				$taxonomies       = get_taxonomies( [ 'public' => true, '_builtin' => false ], 'names' );
				$taxonomy_options = [];
				foreach ( (array) $taxonomies as $taxonomy ) {
					if ( false !== strpos( $taxonomy, 'layout' ) || false !== strpos( $taxonomy, 'et_tb_' )
						|| false !== strpos( $taxonomy, 'scope' ) || false !== strpos( $taxonomy, 'et_code' )
						|| false !== strpos( $taxonomy, 'module_width' ) ) {
						continue;
					}
					$taxonomy_options[ $taxonomy ] = $taxonomy;
				}

				// Route REST de CptPreviewController, calculée côté serveur pour que
				// le navigateur n'ait pas à deviner l'URL de base REST du site —
				// `apiFetch` partagé de Divi (basé sur `path`) 404 sur cette
				// installation en sous-dossier.
				$cpt_preview = [
					'url'   => rest_url( 'd5osm/v1/cpt-pins' ),
					'nonce' => wp_create_nonce( 'wp_rest' ),
				];

				\ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build(
					[
						'name'    => 'd5-module-openstreetmap-builder-bundle-script',
						'version' => D5_OSM_VERSION,
						'script'  => [
							'src'                => $plugin_dir_url . 'scripts/bundle.js',
							// Leaflet (+ plugins) doivent être chargés dans la fenêtre "app" du
							// Visual Builder AVANT notre bundle, pour que la prévisualisation
							// live de la carte (édition) puisse utiliser `window.L`.
							'deps'               => [
								'divi-module-library',
								'divi-vendor-wp-hooks',
								'd5_osm_leaflet_js',
								'd5_osm_leaflet_clusterjs',
								'd5_osm_leaflet_esri_js',
								'd5_osm_leafletgeocoderjs',
								'd5_osm_minimap',
							],
							'data_app_window'    => [
								'translations'   => $translations_map,
								'cptTypes'       => $cpt_options,
								'cptTaxonomies'  => $taxonomy_options,
								'cptPreview'     => $cpt_preview,
							],
							'enqueue_top_window' => false,
							'enqueue_app_window' => true,
						],
						// Handle "groupe" sans fichier propre (src: false) : sert uniquement à
						// tirer les styles Leaflet déjà enregistrés dans register_assets()
						// dans la fenêtre "app" du Visual Builder.
						'style'   => [
							'src'                => false,
							'deps'               => [
								'd5_osm_leaflet_css',
								'd5_osm_markercluster_css',
								'd5_osm_markercluster_default_css',
								'd5_osm_leafletgeocodertcss',
								'd5_osm_minimapcss',
								'd5_osm_overrides_css',
							],
							'enqueue_top_window' => false,
							'enqueue_app_window' => true,
						],
					]
				);
			}
		);
	}

	/**
	 * Enqueue les assets nécessaires
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function enqueue_assets(): void {
		// Toujours charger les assets de base pour Divi 5
		wp_enqueue_style( 'd5_osm_leaflet_css' );
		wp_enqueue_script( 'd5_osm_leaflet_js' );
		wp_enqueue_style( 'd5_osm_markercluster_css' );
		wp_enqueue_style( 'd5_osm_markercluster_default_css' );
		wp_enqueue_script( 'd5_osm_leaflet_clusterjs' );
		wp_enqueue_script( 'd5_osm_leaflet_esri_js' );
		wp_enqueue_style( 'd5_osm_leafletgeocodertcss' );
		wp_enqueue_script( 'd5_osm_leafletgeocoderjs' );
		wp_enqueue_style( 'd5_osm_minimapcss' );
		wp_enqueue_script( 'd5_osm_minimap' );
		wp_enqueue_style( 'd5_osm_overrides_css' );
		wp_enqueue_script( 'd5_osm_map_init' );
	}

	/**
	 * Enregistre le module dans l'arbre de dépendances
	 *
	 * @param DependencyTree $dependency_tree L'arbre de dépendances.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register_module( DependencyTree $dependency_tree ): void {
		$dependency_tree->add_dependency( new self() );
	}
}
