<?php
/**
 * OpenstreetmapModule::module_styles().
 *
 * @package D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use ET\Builder\FrontEnd\Module\Style;
use ET\Builder\Packages\Module\Options\Text\TextStyle;
use ET\Builder\Packages\Module\Options\Css\CssStyle;
use D5OSM\Modules\OpenStreetMap\OpenstreetmapModule;

trait ModuleStylesTrait {

	/**
	 * OpenStreetMap Module's style components.
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
								'advancedStyles' => [
									[
										'componentName' => 'divi/text',
										'props'         => [
											'selector' => $args['orderClass'],
											'attr'     => $attrs['module']['advanced']['text'] ?? [],
										]
									]
								]
							],
						]
					),
					// Map Height.
					$elements->style(
						[
							'attrName' => 'mapHeight',
						]
					),
				],
			]
		);
	}
}
