<?php
/**
 * Validation des couleurs CSS saisies via le color-picker de Divi.
 *
 * Partagé par le module parent (couleurs de la barre latérale) et le module
 * Pin (surcharge par pin). Jumelle côté navigateur : src/css-color.ts — garder
 * les deux synchronisés.
 *
 * @package D5OSM
 * @since 1.0.0
 */

namespace D5OSM;

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

final class CssColor {

	/**
	 * Épaisseur de bordure en px : entier borné à 0-20 (comme le champ range),
	 * ou `$fallback` (ex. '' = "hérite") si la valeur est vide / non numérique.
	 *
	 * @param mixed  $value    Valeur brute de l'attribut.
	 * @param string $fallback Valeur renvoyée si `$value` est vide ou invalide.
	 *
	 * @return string
	 */
	public static function sanitize_width( $value, string $fallback = '' ): string {
		if ( ! is_scalar( $value ) || ! is_numeric( trim( (string) $value ) ) ) {
			return $fallback;
		}

		return (string) max( 0, min( 20, (int) round( (float) $value ) ) );
	}

	/**
	 * Accepte hexadécimal, rgb()/rgba()/hsl()/hsla() et `transparent` ; tout le
	 * reste retombe sur `$fallback`.
	 *
	 * Une couleur globale Divi (`$variable({...})$`, ce que le color-picker
	 * enregistre quand on choisit une couleur de la palette globale) est d'abord
	 * résolue en valeur concrète via l'API de Divi lui-même, puis validée comme
	 * n'importe quelle autre. Si elle ne peut pas être résolue en une couleur
	 * simple (ex. variante avec opacité relative), retombe sur `$fallback`.
	 *
	 * @param mixed  $value    Valeur brute de l'attribut.
	 * @param string $fallback Valeur renvoyée si `$value` est vide ou invalide.
	 *
	 * @return string
	 */
	public static function sanitize( $value, string $fallback = '' ): string {
		$value = is_string( $value ) ? trim( $value ) : '';

		// Divi convertit déjà `$variable({...})$` en `var(--gcid-xxx)` avant d'appeler
		// render_callback (constaté en pratique) ; les deux formes sont donc traitées.
		$is_global_color_var = (bool) preg_match( '/^var\(--gcid-[a-z0-9_-]+\)$/i', $value );

		if ( ( $is_global_color_var || 0 === strpos( $value, '$variable(' ) )
			&& class_exists( '\ET\Builder\Packages\StyleLibrary\Utils\Utils' ) ) {
			$resolved = \ET\Builder\Packages\StyleLibrary\Utils\Utils::resolve_global_color_to_value( $value );
			$resolved = is_string( $resolved ) ? trim( $resolved ) : '';

			// Valeur concrète si Divi sait la donner ; sinon on garde `var(--gcid-xxx)`
			// tel quel (Divi définit cette variable CSS sur les pages qui l'utilisent).
			if ( '' !== $resolved && ! preg_match( '/^\$variable\(|var\(--/', $resolved ) ) {
				$value = $resolved;
			} elseif ( ! $is_global_color_var ) {
				$value = '';
			}
		}

		if ( '' === $value ) {
			return $fallback;
		}

		// Variable de couleur globale non résolue en valeur concrète : acceptée telle quelle.
		if ( preg_match( '/^var\(--gcid-[a-z0-9_-]+\)$/i', $value ) ) {
			return $value;
		}

		$is_hex      = (bool) preg_match( '/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $value );
		$is_function = (bool) preg_match( '/^(?:rgb|hsl)a?\(\s*[0-9.\s,%\/deg-]+\)$/i', $value );

		if ( $is_hex || $is_function || 'transparent' === strtolower( $value ) ) {
			return $value;
		}

		return $fallback;
	}
}
