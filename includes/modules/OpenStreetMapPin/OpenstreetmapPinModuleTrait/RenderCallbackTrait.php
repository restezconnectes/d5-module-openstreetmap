<?php
/**
 * OpenstreetmapPinModule::render_callback()
 *
 * @package D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

// phpcs:disable ET.Sniffs.ValidVariableName.UsedPropertyNotSnakeCase -- WP use snakeCase in \WP_Block_Parser_Block

use ET\Builder\Packages\Module\Module;
use ET\Builder\Packages\Module\Options\Element\ElementComponents;
use ET\Builder\FrontEnd\BlockParser\BlockParserStore;
use ET\Builder\Packages\Module\Layout\Components\ModuleElements\ModuleElements;
use D5OSM\Modules\OpenStreetMapPin\OpenstreetmapPinModule;

// Charger les autres traits
require_once __DIR__ . '/ModuleClassnamesTrait.php';
require_once __DIR__ . '/ModuleStylesTrait.php';
require_once __DIR__ . '/ModuleScriptDataTrait.php';

trait RenderCallbackTrait {
	use ModuleClassnamesTrait;
	use ModuleStylesTrait;
	use ModuleScriptDataTrait;

	/**
	 * OpenStreetMap Pin module render callback which outputs server side rendered HTML on the Front-End.
	 *
	 * @since 1.0.0
	 *
	 * @param array          $attrs    Block attributes that were saved by VB.
	 * @param string         $content  Block content.
	 * @param \WP_Block      $block    Parsed block object that being rendered.
	 * @param ModuleElements $elements ModuleElements instance.
	 *
	 * @return string HTML rendered of OpenStreetMap Pin module.
	 */
	public static function render_callback( $attrs, $content, $block, $elements ) {
		// Récupérer les attributs
		$pin_title = $attrs['pinTitle']['innerContent']['desktop']['value'] ?? '';
		$pin_content = $attrs['pinContent']['innerContent']['desktop']['value'] ?? '';
		$pin_latitude = $attrs['pinLatitude']['innerContent']['desktop']['value'] ?? '47.4';
		$pin_longitude = $attrs['pinLongitude']['innerContent']['desktop']['value'] ?? '1.6';
		$pin_icon = $attrs['pinIcon']['innerContent']['desktop']['value'] ?? 'default';
		$pin_icon_url = $attrs['pinIconUrl']['innerContent']['desktop']['value'] ?? '';
		$pin_icon_width = $attrs['pinIconWidth']['innerContent']['desktop']['value'] ?? '33';
		$pin_icon_height = $attrs['pinIconHeight']['innerContent']['desktop']['value'] ?? '44';
		$show_readmore = ( $attrs['showReadMore']['innerContent']['desktop']['value'] ?? 'on' ) === 'on';
		$readmore_text = $attrs['readMoreText']['innerContent']['desktop']['value'] ?? __( 'Read More...', 'd5-module-openstreetmap' );
		$readmore_class = $attrs['readMoreClass']['innerContent']['desktop']['value'] ?? '';

		// Surcharge du style de la barre latérale pour ce pin (vide = hérite de la carte).
		require_once D5_OSM_PATH . 'includes/CssColor.php';
		$sidebar_bg_color            = \D5OSM\CssColor::sanitize( $attrs['pinSidebarBgColor']['innerContent']['desktop']['value'] ?? '' );
		$sidebar_text_color          = \D5OSM\CssColor::sanitize( $attrs['pinSidebarTextColor']['innerContent']['desktop']['value'] ?? '' );
		$sidebar_button_bg_color     = \D5OSM\CssColor::sanitize( $attrs['pinSidebarButtonBgColor']['innerContent']['desktop']['value'] ?? '' );
		$sidebar_button_border_color = \D5OSM\CssColor::sanitize( $attrs['pinSidebarButtonBorderColor']['innerContent']['desktop']['value'] ?? '' );
		$sidebar_button_border_width = \D5OSM\CssColor::sanitize_width( $attrs['pinSidebarButtonBorderWidth']['innerContent']['desktop']['value'] ?? '' );
		$sidebar_button_text_color   = \D5OSM\CssColor::sanitize( $attrs['pinSidebarButtonTextColor']['innerContent']['desktop']['value'] ?? '' );

		// Récupérer le lien depuis les options de lien avancées
		$link_url = $attrs['module']['advanced']['link']['desktop']['value']['url'] ?? '';
		$link_target = $attrs['module']['advanced']['link']['desktop']['value']['target'] ?? '_self';

		// Préparer les données du marqueur pour le JavaScript
		$marker_data = [
			'latitude'  => floatval( $pin_latitude ),
			'longitude' => floatval( $pin_longitude ),
			'title'     => $pin_title,
			'content'   => $pin_content,
			'icon'      => $pin_icon,
			'iconUrl'   => $pin_icon_url,
			'iconWidth' => intval( $pin_icon_width ),
			'iconHeight' => intval( $pin_icon_height ),
			'showReadMore' => $show_readmore,
			'readMoreText' => $readmore_text,
			'readMoreClass' => $readmore_class,
			// Clés plates volontairement : le parent extrait ce JSON par regex `{[^}]+}`,
			// un sous-objet (`}` imbriqué) tronquerait le JSON et ferait disparaître le pin.
			'sidebarBgColor'           => $sidebar_bg_color,
			'sidebarTextColor'         => $sidebar_text_color,
			'sidebarButtonBgColor'     => $sidebar_button_bg_color,
			'sidebarButtonBorderColor' => $sidebar_button_border_color,
			'sidebarButtonBorderWidth' => $sidebar_button_border_width,
			'sidebarButtonTextColor'   => $sidebar_button_text_color,
			'linkUrl'   => $link_url,
			'linkTarget' => $link_target,
		];

		// Le rendu du Pin est géré par JavaScript dans le module parent
		// On retourne juste un commentaire avec les données
		$pin_output = '<!-- d5osm_pin_data:' . wp_json_encode( $marker_data ) . ' -->';

		// Background component.
		$background_component = ElementComponents::component(
			[
				'attrs'         => $attrs['module']['decoration'] ?? [],
				'id'            => $block->parsed_block['id'],
				'orderIndex'    => $block->parsed_block['orderIndex'],
				'storeInstance' => $block->parsed_block['storeInstance'],
			]
		);

		$parent       = BlockParserStore::get_parent( $block->parsed_block['id'], $block->parsed_block['storeInstance'] );
		$parent_attrs = $parent->attrs ?? [];

		return Module::render(
			[
				'orderIndex'          => $block->parsed_block['orderIndex'],
				'storeInstance'       => $block->parsed_block['storeInstance'],
				'id'                  => $block->parsed_block['id'],
				'name'                => $block->block_type->name,
				'moduleCategory'      => $block->block_type->category,
				'attrs'               => $attrs,
				'elements'            => $elements,
				'classnamesFunction'  => [ OpenstreetmapPinModule::class, 'module_classnames' ],
				'stylesComponent'     => [ OpenstreetmapPinModule::class, 'module_styles' ],
				'scriptDataComponent' => [ OpenstreetmapPinModule::class, 'module_script_data' ],
				'parentAttrs'         => $parent_attrs,
				'parentId'            => $parent->id ?? '',
				'parentName'          => $parent->blockName ?? '',
				'children'            => $background_component . $pin_output,
				'scriptData'          => $marker_data,
			]
		);
	}
}
