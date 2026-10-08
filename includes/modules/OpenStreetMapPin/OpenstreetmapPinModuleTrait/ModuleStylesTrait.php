<?php
/**
 * OpenstreetmapPinModule::module_styles().
 *
 * @package D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use ET\Builder\FrontEnd\Module\Style;
use D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModule;

trait ModuleStylesTrait {

	/**
	 * OpenStreetMap Pin Module's style components.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     An array of arguments.
	 *
	 *      @type string $id                Module ID.
	 *      @type string $name              Module name.
	 *      @type string $attrs             Module attributes.
	 *      @type string $orderClass        Selector class name.
	 *      @type ModuleElements $elements  ModuleElements instance.
	 * }
	 */
	public static function module_styles( $args ) {
		$attrs    = $args['attrs'] ?? [];
		$elements = $args['elements'];
		$settings = $args['settings'] ?? [];

		Style::add(
			[
				'id'            => $args['id'],
				'name'          => $args['name'],
				'orderIndex'    => $args['orderIndex'],
				'storeInstance' => $args['storeInstance'],
				'styles'        => [
					// Module.
					$elements->style(
						[
							'attrName'   => 'module',
							'styleProps' => [
								'disabledOn'     => [
									'disabledModuleVisibility' => $settings['disabledModuleVisibility'] ?? null,
								],
							],
						]
					),
				],
			]
		);
	}
}
