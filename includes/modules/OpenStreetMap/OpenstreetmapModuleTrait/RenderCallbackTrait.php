<?php
/**
 * OpenstreetmapModule::render_callback()
 *
 * @package D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

// phpcs:disable ET.Sniffs.ValidVariableName.UsedPropertyNotSnakeCase -- WP use snakeCase in \WP_Block_Parser_Block

use ET\Builder\Packages\Module\Module;
use ET\Builder\Packages\Module\Options\Element\ElementComponents;
use ET\Builder\FrontEnd\BlockParser\BlockParserStore;
use ET\Builder\Packages\Module\Layout\Components\ModuleElements\ModuleElements;
use ET\Builder\Framework\Utility\HTMLUtility;
use D5OSM\Modules\OpenStreetMap\OpenstreetmapModule;

// Charger les autres traits
require_once __DIR__ . '/ModuleClassnamesTrait.php';
require_once __DIR__ . '/ModuleStylesTrait.php';
require_once __DIR__ . '/ModuleScriptDataTrait.php';
require_once __DIR__ . '/CptMarkersTrait.php';

trait RenderCallbackTrait {
	use ModuleClassnamesTrait;
	use ModuleStylesTrait;
	use ModuleScriptDataTrait;
	use CptMarkersTrait;

	/**
	 * Valide une couleur CSS saisie via le color-picker de Divi avant de la
	 * transmettre au JS (qui l'applique en variable CSS). Accepte hexadécimal,
	 * rgb()/rgba()/hsl()/hsla() et `transparent` ; tout le reste retombe sur la
	 * valeur par défaut.
	 *
	 * Limite connue : une couleur globale Divi (`$variable({...})$`) n'est pas
	 * résolue ici et retombe donc aussi sur la valeur par défaut.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed  $value    Valeur brute de l'attribut.
	 * @param string $fallback Couleur par défaut.
	 *
	 * @return string
	 */
	private static function sanitize_css_color( $value, string $fallback ): string {
		require_once D5_OSM_PATH . 'includes/CssColor.php';

		return \D5OSM\CssColor::sanitize( $value, $fallback );
	}

	/**
	 * OpenStreetMap module render callback which outputs server side rendered HTML on the Front-End.
	 *
	 * @since 1.0.0
	 *
	 * @param array          $attrs    Block attributes that were saved by VB.
	 * @param string         $content  Block content.
	 * @param \WP_Block      $block    Parsed block object that being rendered.
	 * @param ModuleElements $elements ModuleElements instance.
	 *
	 * @return string HTML rendered of OpenStreetMap module.
	 */
	public static function render_callback( $attrs, $content, $block, $elements ) {
		try {
			// Normaliser les attributs (peuvent être vides au premier rendu)
			$attrs = $attrs ?? [];
			
			// Récupérer les attributs avec des valeurs par défaut sécurisées
			$map_height_value = $attrs['mapHeight']['innerContent']['desktop']['value'] ?? '350';
			$map_height = is_numeric( $map_height_value ) ? $map_height_value . 'px' : $map_height_value;
			$latitude = $attrs['latitude']['innerContent']['desktop']['value'] ?? '47.4';
			$longitude = $attrs['longitude']['innerContent']['desktop']['value'] ?? '1.6';
			$zoom = $attrs['zoom']['innerContent']['desktop']['value'] ?? '5.5';
			$base_layer_raw = $attrs['baseLayer']['innerContent']['desktop']['value'] ?? 'https://{s}.tile.osm.org/{z}/{x}/{y}.png';

		$allowed_layers = [
			'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
			'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
			'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		];
		$base_layer = in_array( $base_layer_raw, $allowed_layers, true )
			? $base_layer_raw
			: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png';
		
			// Options de contrôle ("on"/"off" strings from divi/toggle)
			$show_zoom_controls = ( $attrs['showZoomControls']['innerContent']['desktop']['value'] ?? 'on' ) === 'on';
			$scroll_wheel_zoom  = ( $attrs['scrollWheelZoom']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$double_click_zoom  = ( $attrs['doubleClickZoom']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$min_zoom           = $attrs['minZoom']['innerContent']['desktop']['value'] ?? '0';
			$max_zoom           = $attrs['maxZoom']['innerContent']['desktop']['value'] ?? '18';
			$fit_markers        = ( $attrs['fitMarkers']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$control_layers     = ( $attrs['controlLayers']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$display_search     = ( $attrs['displaySearch']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$search_color       = $attrs['searchMarkerColor']['decoration']['background']['desktop']['value']['color'] ?? '#fe6c58';
			$display_minimap    = ( $attrs['displayMinimap']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$display_location   = ( $attrs['displayLocation']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$display_home_button = ( $attrs['displayHomeButton']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';
			$display_sidebar   = ( $attrs['displaySidebar']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';

			// Couleurs de la barre latérale (onglet Style > Sidebar).
			$sidebar_bg_color            = self::sanitize_css_color( $attrs['sidebarBgColor']['innerContent']['desktop']['value'] ?? '', '#ffffff' );
			$sidebar_text_color          = self::sanitize_css_color( $attrs['sidebarTextColor']['innerContent']['desktop']['value'] ?? '', '#333333' );
			$sidebar_button_bg_color     = self::sanitize_css_color( $attrs['sidebarButtonBgColor']['innerContent']['desktop']['value'] ?? '', '#0052b1' );
			$sidebar_button_border_color = self::sanitize_css_color( $attrs['sidebarButtonBorderColor']['innerContent']['desktop']['value'] ?? '', '#0052b1' );
			require_once D5_OSM_PATH . 'includes/CssColor.php';
			$sidebar_button_border_width = \D5OSM\CssColor::sanitize_width( $attrs['sidebarButtonBorderWidth']['innerContent']['desktop']['value'] ?? '', '1' );
			$sidebar_button_text_color   = self::sanitize_css_color( $attrs['sidebarButtonTextColor']['innerContent']['desktop']['value'] ?? '', '#ffffff' );

			// Marqueur par défaut
			$default_icon = $attrs['defaultMarkerIcon']['innerContent']['desktop']['value'] ?? 'default';
			$default_icon_url = $attrs['defaultMarkerIconUrl']['innerContent']['desktop']['value'] ?? '';
			$default_icon_width = $attrs['defaultMarkerIconWidth']['innerContent']['desktop']['value'] ?? '33';
			$default_icon_height = $attrs['defaultMarkerIconHeight']['innerContent']['desktop']['value'] ?? '44';

		// ID unique pour la carte
		$map_id = 'd5osm_map_' . uniqid();

		// Conteneur de la carte
		$map_container = HTMLUtility::render(
			[
				'tag'        => 'div',
				'attributes' => [
					'id'    => $map_id,
					'class' => 'd5osm_map_container',
					'style' => 'height: ' . esc_attr( $map_height ) . ';',
				],
			]
		);

		// Extraire les données des pins depuis le contenu
		$pins_data = [];
		if ( ! empty( $content ) ) {
			// Parser le contenu pour extraire les données des pins
			preg_match_all( '/<!-- d5osm_pin_data:({[^}]+}) -->/', $content, $matches );
			if ( ! empty( $matches[1] ) ) {
				foreach ( $matches[1] as $json_str ) {
					$pin_data = json_decode( $json_str, true );
					if ( $pin_data ) {
						$pins_data[] = $pin_data;
					}
				}
			}
		}

		// Ajouter les marqueurs issus du Custom Post Type, si activé.
		$pins_data = array_merge( $pins_data, self::get_cpt_pins( $attrs ) );

		$show_markers_only = ( $attrs['showMarkersOnly']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';

		// Script JavaScript pour initialiser la carte
		$script_data = [
			'mapId'            => $map_id,
			'latitude'         => floatval( $latitude ),
			'longitude'        => floatval( $longitude ),
			'zoom'             => floatval( $zoom ),
			'baseLayer'        => $base_layer,
			'showZoomControls' => $show_zoom_controls,
			'scrollWheelZoom'  => $scroll_wheel_zoom,
			'doubleClickZoom'  => $double_click_zoom,
			'minZoom'          => intval( $min_zoom ),
			'maxZoom'          => intval( $max_zoom ),
			'fitMarkers'       => $fit_markers,
			'controlLayers'    => $control_layers,
			'displaySearch'    => $display_search,
			'searchColor'      => $search_color,
			'displayMinimap'    => $display_minimap,
			'displayLocation'  => $display_location,
			'displayHomeButton' => $display_home_button,
			'displaySidebar'   => $display_sidebar,
			'sidebarBgColor'           => $sidebar_bg_color,
			'sidebarTextColor'         => $sidebar_text_color,
			'sidebarButtonBgColor'     => $sidebar_button_bg_color,
			'sidebarButtonBorderColor' => $sidebar_button_border_color,
			'sidebarButtonBorderWidth' => $sidebar_button_border_width,
			'sidebarButtonTextColor'   => $sidebar_button_text_color,
			'defaultIcon'      => $default_icon,
			'defaultIconUrl'   => $default_icon_url,
			'defaultIconWidth' => intval( $default_icon_width ),
			'defaultIconHeight' => intval( $default_icon_height ),
			'pins'             => $pins_data,
			'showMarkersOnly'  => $show_markers_only,
		];

		// Ajouter le script inline pour initialiser la carte
		$script_inline = HTMLUtility::render(
			[
				'tag'               => 'script',
				'attributes'        => [
					'type' => 'text/javascript',
				],
				'childrenSanitizer' => 'et_core_esc_previously',
				'children'          => sprintf(
					'window.d5osm_map_%s = %s;',
					esc_js( $map_id ),
					wp_json_encode( $script_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
				),
			]
		);

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
					'classnamesFunction'  => [ OpenstreetmapModule::class, 'module_classnames' ],
					'stylesComponent'     => [ OpenstreetmapModule::class, 'module_styles' ],
					'scriptDataComponent' => [ OpenstreetmapModule::class, 'module_script_data' ],
					'parentAttrs'         => $parent_attrs,
					'parentId'            => $parent->id ?? '',
					'parentName'          => $parent->blockName ?? '',
					'children'            => $background_component . $map_container . $script_inline,
				]
			);
		} catch ( \Exception $e ) {
			// Log l'erreur pour le debug
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'D5 OSM: Erreur dans render_callback: ' . $e->getMessage() );
				error_log( 'D5 OSM: Stack trace: ' . $e->getTraceAsString() );
			}
			
			// Retourner un message d'erreur visible en mode debug
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				return '<div class="d5osm-error">Erreur: ' . esc_html( $e->getMessage() ) . '</div>';
			}
			
			// En production, retourner un contenu vide
			return '';
		}
	}
}
