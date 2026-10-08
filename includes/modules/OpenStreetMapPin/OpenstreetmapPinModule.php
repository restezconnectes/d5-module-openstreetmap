<?php
/**
 * Module: OpenStreetMap Pin Module class.
 *
 * @package D5OSM\Modules\OpenStreetMapPin
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMapPin;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use ET\Builder\Framework\DependencyManagement\Interfaces\DependencyInterface;
use ET\Builder\Packages\ModuleLibrary\ModuleRegistration;
use D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModuleTrait\RenderCallbackTrait;

// Charger les traits
require_once __DIR__ . '/OpenstreetmapPinModuleTrait/RenderCallbackTrait.php';
require_once __DIR__ . '/OpenstreetmapPinModuleTrait/ModuleClassnamesTrait.php';
require_once __DIR__ . '/OpenstreetmapPinModuleTrait/ModuleStylesTrait.php';
require_once __DIR__ . '/OpenstreetmapPinModuleTrait/ModuleScriptDataTrait.php';

/**
 * `OpenstreetmapPinModule` is consisted of functions used for OpenStreetMap Pin Module such as Front-End rendering, REST API Endpoints etc.
 *
 * This is a dependency class and can be used as a dependency for `DependencyTree`.
 *
 * @since 1.0.0
 */
class OpenstreetmapPinModule implements DependencyInterface {
	use RenderCallbackTrait;

	/**
	 * Flag pour éviter l'enregistrement multiple
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Flag pour éviter l'ajout multiple du hook
	 *
	 * @var bool
	 */
	private static $hook_added = false;

	/**
	 * Enregistre le module (méthode réutilisable)
	 *
	 * @param string $module_json_folder_path Chemin vers le dossier module.json.
	 * @param string $module_name Nom du module.
	 *
	 * @return void
	 */
	private static function do_register_module( string $module_json_folder_path, string $module_name ): void {
		// Vérifier si déjà enregistré
		if ( self::$registered ) {
			return;
		}

		// Vérifier que ModuleRegistration existe
		if ( ! class_exists( 'ET\Builder\Packages\ModuleLibrary\ModuleRegistration' ) ) {
			return;
		}
		
		// Vérifier que le fichier module.json existe
		if ( ! file_exists( $module_json_folder_path . '/module.json' ) ) {
			return;
		}
		
		// Vérifier si le module est déjà enregistré dans WordPress
		if ( class_exists( 'WP_Block_Type_Registry' ) ) {
			$registry = \WP_Block_Type_Registry::get_instance();
			if ( $registry->is_registered( $module_name ) ) {
				self::$registered = true;
				return; // Déjà enregistré
			}
		}
		
		// Enregistrer le module enfant
		$result = ModuleRegistration::register_module(
			$module_json_folder_path,
			[
				'render_callback' => [ OpenstreetmapPinModule::class, 'render_callback' ],
			]
		);
		
		// Marquer comme enregistré
		if ( $result ) {
			self::$registered = true;
		}
	}

	/**
	 * Loads `OpenstreetmapPinModule` and registers Front-End render callback and REST API Endpoints.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load() {
		// Éviter l'ajout multiple du hook
		if ( self::$hook_added ) {
			return;
		}
		self::$hook_added = true;

		$module_json_folder_path = __DIR__;
		$module_name = 'd5osm/openstreetmap-module-pin';

		// Si init a déjà été déclenché, enregistrer directement
		if ( did_action( 'init' ) ) {
			self::do_register_module( $module_json_folder_path, $module_name );
			return;
		}

		// Sinon, enregistrer sur init
		add_action(
			'init',
			function() use ( $module_json_folder_path, $module_name ) {
				self::do_register_module( $module_json_folder_path, $module_name );
			},
			10,
			0
		);
	}
}
