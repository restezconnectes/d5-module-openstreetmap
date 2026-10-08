<?php
/**
 * Plugin Name: Module OpenStreetMap for Divi 5
 * Plugin URI:  https://madeby.restezconnectes.fr/project/divi5-module-openstreetmap/
 * Description: Module OpenStreetMap pour Divi 5. Ajoutez des cartes OpenStreetMap dans vos pages avec de nombreux marqueurs et options de personnalisation.
 * Version: 1.0.0
 * Tested up to: 7.1
 * Requires at least: 6.9
 * Requires PHP: 8.1
 * Author: Florent Maillefaud
 * Author URI: https://restezconnectes.fr
 * Domain Path: /languages
 * Text Domain: d5-module-openstreetmap
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

/*  Copyright 2026 Florent Maillefaud (email: contact at restezconnectes.fr) */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Définir les constantes
define( 'D5_OSM_VERSION', '1.0.0' );
define( 'D5_OSM_URL', plugins_url( '/', __FILE__ ) );
define( 'D5_OSM_PATH', plugin_dir_path( __FILE__ ) );
define( 'D5_OSM_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Initialise l'extension pour Divi 5
 *
 * @since 1.0.0
 *
 * @param object $dependency_tree L'arbre de dépendances Divi 5.
 */
function d5_osm_initialize_extension( $dependency_tree ) {
	// Si le hook est appelé, c'est que Divi 5 est là, on peut continuer
	// même si la détection échoue (les classes peuvent ne pas être chargées encore)
	if ( ! $dependency_tree ) {
		return;
	}

	require_once D5_OSM_PATH . 'includes/D5ModuleOpenstreetmap.php';
	\D5OSM\D5ModuleOpenstreetmap::register_module( $dependency_tree );
}
add_action( 'divi_module_library_modules_dependency_tree', 'd5_osm_initialize_extension', 10, 1 );

/**
 * Charge les traductions
 *
 * @since 1.0.0
 */

function d5_osm_load_textdomain() {
	load_plugin_textdomain( 'd5-module-openstreetmap', false, dirname( D5_OSM_BASENAME ) . '/languages/' );
}
// `plugins_loaded` (not `init`): our module.json translations run from
// `block_type_metadata`, fired as soon as Divi registers our module — which
// can happen before `init` finishes. Loading the textdomain on `init` risked
// a race where `__()` ran before the .mo file was bound, in which case it
// permanently falls back to English for that request.
add_action( 'plugins_loaded', 'd5_osm_load_textdomain' );

// Traduit les libellés/descriptions de nos module.json (le cœur de Divi 5
// applique le filtre `block_type_metadata` sur chaque module.json décodé
// avant de l'envoyer au Visual Builder ; voir ModuleI18n.php). Enregistré
// tôt et sans condition : le filtre lui-même ignore tout module qui n'est
// pas le nôtre, donc c'est un no-op si Divi 5 n'est pas actif.
require_once D5_OSM_PATH . 'includes/ModuleI18n.php';
\D5OSM\ModuleI18n::register();
