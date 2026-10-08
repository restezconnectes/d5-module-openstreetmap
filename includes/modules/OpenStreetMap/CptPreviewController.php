<?php
/**
 * REST endpoint powering the "Custom Post Type Markers" live preview in the
 * Visual Builder edit canvas (see src/components/openstreetmap-module/use-cpt-preview-pins.ts).
 *
 * The parent module's front-end render already builds CPT pins server-side
 * (CptMarkersTrait::get_cpt_pins(), used from render_callback) — that data
 * simply isn't reachable from the React edit.tsx component, which only ever
 * sees the block's own saved attrs. This controller re-uses the exact same
 * query/pin-building logic (CptMarkersTrait::build_cpt_pins()) so the
 * preview and the published page always agree.
 *
 * @package D5OSM\Modules\OpenStreetMap
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMap;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

use D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait\CptMarkersTrait;

class CptPreviewController {

	use CptMarkersTrait;

	/**
	 * Registers the REST route.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_route' ] );
	}

	/**
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register_route(): void {
		register_rest_route(
			'd5osm/v1',
			'/cpt-pins',
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'handle_request' ],
				'permission_callback' => static function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => [
					'postType' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_key',
					],
					'taxonomy' => [
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_key',
					],
					'terms'    => [
						'type' => 'string',
					],
				],
			]
		);
	}

	/**
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request instance.
	 *
	 * @return \WP_REST_Response
	 */
	public static function handle_request( \WP_REST_Request $request ): \WP_REST_Response {
		$post_type = sanitize_key( (string) $request->get_param( 'postType' ) );

		if ( '' === $post_type || ! post_type_exists( $post_type ) ) {
			return new \WP_REST_Response( [ 'pins' => [] ], 200 );
		}

		$pins = self::build_cpt_pins(
			[
				'post_type'       => $post_type,
				'taxonomy'        => sanitize_key( (string) $request->get_param( 'taxonomy' ) ),
				'terms'           => (string) $request->get_param( 'terms' ),
				'use_excerpt'     => 'true' === $request->get_param( 'useExcerpt' ),
				'show_readmore'   => 'true' === $request->get_param( 'showReadmore' ),
				'readmore_text'   => (string) ( $request->get_param( 'readmoreText' ) ?: __( 'Read More...', 'd5-module-openstreetmap' ) ), // phpcs:ignore Universal.Operators.DisallowShortTernary.Found -- empty string should fall through to the default too.
				'readmore_target' => (string) $request->get_param( 'readmoreTarget' ),
				'show_thumbs'     => 'true' === $request->get_param( 'showThumbs' ),
				'default_icon'    => (string) ( $request->get_param( 'defaultIcon' ) ?: 'default' ), // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
				'default_url'     => (string) $request->get_param( 'defaultIconUrl' ),
				'icon_width'      => (int) $request->get_param( 'iconWidth' ),
				'icon_height'     => (int) $request->get_param( 'iconHeight' ),
			]
		);

		// build_cpt_pins() returns the same shape front-end pins use
		// (latitude/longitude as floats, etc.) — already JSON-safe.
		return new \WP_REST_Response( [ 'pins' => $pins ], 200 );
	}
}
