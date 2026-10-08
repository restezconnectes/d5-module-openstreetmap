<?php
/**
 * OpenstreetmapModule::module_script_data()
 *
 * @package D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use ET\Builder\Packages\Module\Options\Element\ElementScriptData;

trait ModuleScriptDataTrait {

	/**
	 * Set script data of used module options.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *   Array of arguments.
	 *
	 *   @type string $id       Module id.
	 *   @type string $selector Module selector.
	 *   @type array  $attrs    Module attributes.
	 *   @type array  $scriptData Script data from render callback.
	 * }
	 */
	public static function module_script_data( $args ) {
		$id             = $args['id'] ?? '';
		$selector       = $args['selector'] ?? '';
		$attrs          = $args['attrs'] ?? [];
		$store_instance = $args['storeInstance'] ?? null;
		$script_data    = $args['scriptData'] ?? [];

		// Module decoration attributes.
		$module_decoration_attrs = $attrs['module']['decoration'] ?? [];

		// Element Script Data Options.
		ElementScriptData::set(
			[
				'id'            => $id,
				'selector'      => $selector,
				'attrs'         => array_merge(
					$module_decoration_attrs,
					[
						'link' => $args['attrs']['module']['advanced']['link'] ?? [],
					]
				),
				'storeInstance' => $store_instance,
			]
		);

		// Les données de script seront passées via le render callback
		// et traitées par le JavaScript d'initialisation
	}
}
