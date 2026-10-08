<?php
/**
 * OpenstreetmapModule::get_cpt_pins()
 *
 * Builds the marker list for the "Custom Post Type Markers" feature, reading the
 * same post-meta convention used by the Divi 4 version of this plugin
 * ({post_type}_latitude, {post_type}_longitude, coordinates, ...) so that data
 * entered by editors (via ACF or any custom-fields plugin) keeps working.
 *
 * @package D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait
 * @since 1.0.0
 */

namespace D5OSM\Modules\OpenStreetMap\OpenstreetmapModuleTrait;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

trait CptMarkersTrait {

	/**
	 * Checks whether a pair of values is a valid latitude/longitude pair.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $lat  Latitude value.
	 * @param mixed $long Longitude value.
	 *
	 * @return bool
	 */
	private static function is_valid_coordinate( $lat, $long ): bool {
		if ( '' === $lat || '' === $long || null === $lat || null === $long ) {
			return false;
		}

		$lat_pattern  = '/\A[+-]?(?:90(?:\.0{1,18})?|\d(?(?<=9)|\d?)\.\d{1,18})\z/x';
		$long_pattern = '/\A[+-]?(?:180(?:\.0{1,18})?|(?:1[0-7]\d|\d{1,2})\.\d{1,18})\z/x';

		return (bool) preg_match( $lat_pattern, (string) $lat ) && (bool) preg_match( $long_pattern, (string) $long );
	}

	/**
	 * Resolves the latitude/longitude of a post. Tries, in order:
	 * 1. "{post_type}_latitude"/"{post_type}_longitude" (the Divi 4 module's
	 *    own convention, kept for sites migrating existing data).
	 * 2. A generic "coordinates" meta ("lat,long" in one field).
	 * 3. Plain "latitude"/"longitude" meta keys — the common convention for
	 *    a hand-added ACF (or similar) field pair not tied to any plugin.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $post_id   Post ID.
	 * @param string $post_type Post type slug.
	 *
	 * @return array{0: string, 1: string}|null [ latitude, longitude ] or null if none found.
	 */
	private static function get_post_coordinates( int $post_id, string $post_type ) {
		$latitude  = get_post_meta( $post_id, $post_type . '_latitude', true );
		$longitude = get_post_meta( $post_id, $post_type . '_longitude', true );
		if ( self::is_valid_coordinate( $latitude, $longitude ) ) {
			return [ $latitude, $longitude ];
		}

		$coordinates = get_post_meta( $post_id, 'coordinates', true );
		if ( ! empty( $coordinates ) ) {
			$parts = array_map( 'trim', explode( ',', (string) $coordinates ) );
			if ( isset( $parts[0], $parts[1] ) && self::is_valid_coordinate( $parts[0], $parts[1] ) ) {
				return [ $parts[0], $parts[1] ];
			}
		}

		$latitude  = get_post_meta( $post_id, 'latitude', true );
		$longitude = get_post_meta( $post_id, 'longitude', true );
		if ( self::is_valid_coordinate( $latitude, $longitude ) ) {
			return [ $latitude, $longitude ];
		}

		return null;
	}

	/**
	 * Resolves the marker icon URL for a post, honouring a per-taxonomy-term
	 * icon override stored as "{taxonomy}-icon-id" term meta (an attachment
	 * ID). This is an opt-in convention: a site adds its own term-meta UI for
	 * it (see the "taxonomy-img.php" pattern documented in README.md) on
	 * whichever taxonomy it wants a category icon for — the plugin itself
	 * ships no such UI. Falls back to the module's own "Default Marker Icon"
	 * setting when no term of the post has that meta set.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $post_id       Post ID.
	 * @param string $post_type     Post type slug.
	 * @param string $default_icon  Default icon slug (used as fallback).
	 * @param string $default_url   Default custom icon URL (used as fallback).
	 *
	 * @return array{icon: string, iconUrl: string}
	 */
	private static function get_post_marker_icon( int $post_id, string $post_type, string $default_icon, string $default_url ): array {
		$taxonomies = get_object_taxonomies( $post_type );

		foreach ( $taxonomies as $taxonomy ) {
			$terms = get_the_terms( $post_id, $taxonomy );
			if ( empty( $terms ) || is_wp_error( $terms ) ) {
				continue;
			}

			$icon_id = get_term_meta( $terms[0]->term_id, $taxonomy . '-icon-id', true );
			if ( ! empty( $icon_id ) ) {
				$icon_url = wp_get_attachment_url( (int) $icon_id );
				if ( ! empty( $icon_url ) ) {
					return [
						'icon'    => '',
						'iconUrl' => $icon_url,
					];
				}
			}
		}

		return [
			'icon'    => $default_icon,
			'iconUrl' => $default_url,
		];
	}

	/**
	 * Builds the pin list contributed by the "Custom Post Type Markers" feature.
	 *
	 * @since 1.0.0
	 *
	 * @param array $attrs Block attributes (module attrs, already normalised).
	 *
	 * @return array<int, array<string, mixed>> Pins, using the same shape as the
	 *                                           OpenStreetMap Pin child module.
	 */
	private static function get_cpt_pins( array $attrs ): array {
		$cpt_markers = ( $attrs['cptMarkers']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';

		if ( ! $cpt_markers ) {
			return [];
		}

		$post_type = sanitize_key( $attrs['cptPostType']['innerContent']['desktop']['value'] ?? '' );

		if ( '' === $post_type || ! post_type_exists( $post_type ) ) {
			return [];
		}

		$map_single = ( $attrs['cptMapSingle']['innerContent']['desktop']['value'] ?? 'off' ) === 'on';

		// On a single post of this CPT, only show that post's own marker unless "Display All Markers" is enabled.
		$single_post_id = 0;
		if ( is_singular( $post_type ) && ! $map_single ) {
			$single_post_id = get_queried_object_id();
		}

		return self::build_cpt_pins(
			[
				'post_type'       => $post_type,
				'taxonomy'        => sanitize_key( $attrs['cptTaxonomy']['innerContent']['desktop']['value'] ?? '' ),
				'terms'           => (string) ( $attrs['cptTerms']['innerContent']['desktop']['value'] ?? '' ),
				'use_excerpt'     => ( $attrs['cptExcerpt']['innerContent']['desktop']['value'] ?? 'off' ) === 'on',
				'show_readmore'   => ( $attrs['cptShowReadmore']['innerContent']['desktop']['value'] ?? 'on' ) === 'on',
				'readmore_text'   => (string) ( $attrs['cptReadmoreText']['innerContent']['desktop']['value'] ?? __( 'Read More...', 'd5-module-openstreetmap' ) ),
				'readmore_target' => ( $attrs['cptReadmoreTarget']['innerContent']['desktop']['value'] ?? '_blank' ) === '_self' ? '_self' : '_blank',
				'show_thumbs'     => ( $attrs['thumbMarkers']['innerContent']['desktop']['value'] ?? 'off' ) === 'on',
				'default_icon'    => (string) ( $attrs['defaultMarkerIcon']['innerContent']['desktop']['value'] ?? 'default' ),
				'default_url'     => (string) ( $attrs['defaultMarkerIconUrl']['innerContent']['desktop']['value'] ?? '' ),
				'icon_width'      => (int) ( $attrs['defaultMarkerIconWidth']['innerContent']['desktop']['value'] ?? 33 ),
				'icon_height'     => (int) ( $attrs['defaultMarkerIconHeight']['innerContent']['desktop']['value'] ?? 44 ),
				'single_post_id'  => $single_post_id,
			]
		);
	}

	/**
	 * Shared query + pin-building core, used both by the front-end
	 * render_callback (via get_cpt_pins()) and by the REST endpoint that
	 * powers the Visual Builder's live preview (CptPreviewController).
	 *
	 * @since 1.0.0
	 *
	 * @param array $params {
	 *     @type string $post_type       Post type slug (already sanitized).
	 *     @type string $taxonomy        Taxonomy slug to filter by, or ''.
	 *     @type string $terms           Comma-separated term slugs, or ''.
	 *     @type bool   $use_excerpt     Use the post excerpt as popup content.
	 *     @type bool   $show_readmore   Show the "Read More" link by default.
	 *     @type string $readmore_text   Default "Read More" link text.
	 *     @type string $readmore_target Default link target ('_blank'|'_self').
	 *     @type bool   $show_thumbs     Include the featured image URL.
	 *     @type string $default_icon    Default marker icon slug.
	 *     @type string $default_url     Default custom marker icon URL.
	 *     @type int    $icon_width      Marker icon width.
	 *     @type int    $icon_height     Marker icon height.
	 *     @type int    $single_post_id  If > 0, only this post is queried
	 *                                   (front-end single-post-page case).
	 * }
	 *
	 * @return array<int, array<string, mixed>> Pins, using the same shape as the
	 *                                           OpenStreetMap Pin child module.
	 */
	private static function build_cpt_pins( array $params ): array {
		$post_type       = $params['post_type'];
		$taxonomy        = $params['taxonomy'] ?? '';
		$terms_raw       = $params['terms'] ?? '';
		$use_excerpt     = ! empty( $params['use_excerpt'] );
		$show_readmore   = ! empty( $params['show_readmore'] );
		$readmore_text   = $params['readmore_text'] ?? __( 'Read More...', 'd5-module-openstreetmap' );
		$readmore_target = ( $params['readmore_target'] ?? '_blank' ) === '_self' ? '_self' : '_blank';
		$show_thumbs     = ! empty( $params['show_thumbs'] );
		$default_icon    = $params['default_icon'] ?? 'default';
		$default_url     = $params['default_url'] ?? '';
		$icon_width      = (int) ( $params['icon_width'] ?? 33 );
		$icon_height     = (int) ( $params['icon_height'] ?? 44 );
		$single_post_id  = (int) ( $params['single_post_id'] ?? 0 );

		if ( $single_post_id ) {
			$query_args = [
				'post_type' => $post_type,
				'p'         => $single_post_id,
			];
		} else {
			$query_args = [
				'post_type'      => $post_type,
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			];

			if ( '' !== $taxonomy ) {
				$tax_query = [ 'taxonomy' => $taxonomy ];

				$terms = array_filter( array_map( 'trim', explode( ',', $terms_raw ) ) );
				if ( ! empty( $terms ) ) {
					$tax_query['field'] = 'slug';
					$tax_query['terms'] = $terms;
				} else {
					$tax_query['operator'] = 'EXISTS';
				}

				$query_args['tax_query'] = [ $tax_query ]; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
			}
		}

		$posts = get_posts( $query_args );

		if ( empty( $posts ) ) {
			return [];
		}

		$pins = [];

		foreach ( $posts as $post ) {
			$coordinates = self::get_post_coordinates( $post->ID, $post_type );
			if ( null === $coordinates ) {
				continue;
			}

			list( $latitude, $longitude ) = $coordinates;

			$content = '';
			if ( $use_excerpt ) {
				$content = wp_strip_all_tags( get_the_excerpt( $post ) );
			} else {
				$content = (string) get_post_meta( $post->ID, $post_type . '_text_marker', true );
			}

			$custom_link  = get_post_meta( $post->ID, $post_type . '_link_custom_link', true );
			$link_url     = ! empty( $custom_link ) ? esc_url( $custom_link ) : get_permalink( $post );

			$meta_target = get_post_meta( $post->ID, $post_type . '_link_target', true );
			$link_target = '' !== $meta_target ? ( '1' === (string) $meta_target ? '_blank' : '_self' ) : $readmore_target;

			$meta_readmore = get_post_meta( $post->ID, $post_type . '_link_more', true );
			$post_show_readmore = '' !== $meta_readmore ? '1' === (string) $meta_readmore : $show_readmore;

			$thumbnail = '';
			if ( $show_thumbs && has_post_thumbnail( $post ) ) {
				$thumbnail = get_the_post_thumbnail_url( $post, 'thumbnail' );
			}

			$icon = self::get_post_marker_icon( $post->ID, $post_type, $default_icon, $default_url );

			$pins[] = [
				'latitude'     => floatval( $latitude ),
				'longitude'    => floatval( $longitude ),
				'title'        => get_the_title( $post ),
				'content'      => $content,
				'icon'         => $icon['icon'],
				'iconUrl'      => $icon['iconUrl'],
				'iconWidth'    => $icon_width,
				'iconHeight'   => $icon_height,
				'showReadMore' => $post_show_readmore,
				'readMoreText' => $readmore_text,
				'linkUrl'      => $link_url,
				'linkTarget'   => $link_target,
				'thumbnail'    => $thumbnail,
				'isCpt'        => true,
			];
		}

		return $pins;
	}
}
