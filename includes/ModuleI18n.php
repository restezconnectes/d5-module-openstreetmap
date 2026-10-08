<?php
/**
 * Translates our own module.json field labels/descriptions before Divi 5
 * hands them to the Visual Builder.
 *
 * `module.json` is a static JSON file, so it can't call `__()` itself. Divi
 * 5's module registration reuses WordPress core's `register_block_type_*`
 * machinery, which fires the standard `block_type_metadata` filter on the
 * decoded JSON before it's sent to the (React) Visual Builder — the same
 * filter WordPress core itself uses to translate block.json's top-level
 * `title`/`description`/`keywords` for any block that declares a
 * `"textdomain"`. That core i18n schema stops at those few standard keys,
 * though; it has no notion of Divi's own nested per-field `label` /
 * `description` / `groupLabel` structure, so those would stay hard-coded in
 * English for every locale without this filter.
 *
 * @package D5OSM
 * @since 1.0.0
 */

namespace D5OSM;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

class ModuleI18n {

	/**
	 * Block/module names this plugin owns. Only metadata for these is
	 * touched — everything else (Divi core modules, WP core blocks, other
	 * extensions) passes through untouched.
	 *
	 * @var string[]
	 */
	private static $module_names = [
		'd5osm/openstreetmap-module',
		'd5osm/openstreetmap-module-pin',
	];

	/**
	 * Object/array keys that hold genuine, translatable UI text anywhere in
	 * a module.json tree. Deliberately an allow-list (rather than
	 * translating every string) so internal identifiers — slugs, class
	 * names, group/attr names, icon names, hex colors, URLs — are never
	 * accidentally mistranslated.
	 *
	 * @var string[]
	 */
	private static $translatable_keys = [
		'title',
		'titles',
		'childModuleTitle',
		'label',
		'description',
		'groupLabel',
		'fieldLabel',
	];

	/**
	 * Attribute names whose *default value* is genuine display text (shown
	 * front-end and pre-filled in the Visual Builder) rather than an
	 * identifier/number/color, keyed by module name.
	 *
	 * @var array<string, string[]>
	 */
	private static $translatable_defaults = [
		'd5osm/openstreetmap-module-pin' => [ 'readMoreText' ],
		'd5osm/openstreetmap-module'     => [ 'cptReadmoreText' ],
	];

	/**
	 * Registers the filter.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register(): void {
		add_filter( 'block_type_metadata', [ __CLASS__, 'translate_metadata' ] );
	}

	/**
	 * Translates one module's metadata array, if it's one of ours.
	 *
	 * @since 1.0.0
	 *
	 * @param array $metadata Decoded module.json content.
	 *
	 * @return array
	 */
	public static function translate_metadata( $metadata ) {
		if ( ! is_array( $metadata ) || empty( $metadata['name'] ) || ! in_array( $metadata['name'], self::$module_names, true ) ) {
			return $metadata;
		}

		// Divi can register our module (and so fire `block_type_metadata`)
		// before the main plugin file's own `plugins_loaded` callback has
		// run -- e.g. if something else loads this class directly. Make
		// sure the .mo is bound before any `__()` call below, since a
		// domain not yet loaded silently falls back to the English source
		// string for the rest of that request.
		if ( ! is_textdomain_loaded( 'd5-module-openstreetmap' ) && defined( 'D5_OSM_BASENAME' ) ) {
			load_plugin_textdomain( 'd5-module-openstreetmap', false, dirname( D5_OSM_BASENAME ) . '/languages/' );
		}

		$metadata = self::translate_labels_recursive( $metadata );

		$default_attrs = self::$translatable_defaults[ $metadata['name'] ] ?? [];
		foreach ( $default_attrs as $attr_name ) {
			$path = [ 'attributes', $attr_name, 'default', 'innerContent', 'desktop', 'value' ];
			$value = self::get_by_path( $metadata, $path );
			if ( is_string( $value ) && '' !== $value ) {
				$metadata = self::set_by_path( $metadata, $path, __( $value, 'd5-module-openstreetmap' ) ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText -- source string comes from our own module.json, not user input.
			}
		}

		return $metadata;
	}

	/**
	 * Walks an array/object tree translating any value keyed by one of
	 * `self::$translatable_keys`.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $node Current tree node.
	 *
	 * @return mixed
	 */
	private static function translate_labels_recursive( $node ) {
		if ( ! is_array( $node ) ) {
			return $node;
		}

		foreach ( $node as $key => $value ) {
			if ( is_string( $key ) && in_array( $key, self::$translatable_keys, true ) && is_string( $value ) && '' !== $value ) {
				$node[ $key ] = __( $value, 'd5-module-openstreetmap' ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText -- source string comes from our own module.json, not user input.
			} elseif ( is_array( $value ) ) {
				$node[ $key ] = self::translate_labels_recursive( $value );
			}
		}

		return $node;
	}

	/**
	 * Reads a value from a nested array by a list of keys, or null if any
	 * segment is missing.
	 *
	 * @since 1.0.0
	 *
	 * @param array $array Array to read from.
	 * @param array $path  List of nested keys.
	 *
	 * @return mixed
	 */
	private static function get_by_path( array $array, array $path ) {
		$node = $array;
		foreach ( $path as $segment ) {
			if ( ! is_array( $node ) || ! array_key_exists( $segment, $node ) ) {
				return null;
			}
			$node = $node[ $segment ];
		}
		return $node;
	}

	/**
	 * Sets a value in a nested array by a list of keys, creating
	 * intermediate arrays as needed, and returns the updated array.
	 *
	 * @since 1.0.0
	 *
	 * @param array $array Array to update.
	 * @param array $path  List of nested keys.
	 * @param mixed $value Value to set.
	 *
	 * @return array
	 */
	private static function set_by_path( array $array, array $path, $value ): array {
		$ref = &$array;
		foreach ( $path as $segment ) {
			if ( ! isset( $ref[ $segment ] ) || ! is_array( $ref[ $segment ] ) ) {
				$ref[ $segment ] = [];
			}
			$ref = &$ref[ $segment ];
		}
		$ref = $value;
		return $array;
	}
}
