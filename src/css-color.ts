/**
 * Client-side twin of D5OSM\CssColor::sanitize() (PHP) — keep the two in sync.
 * Accepts hex, rgb()/rgba()/hsl()/hsla() and `transparent`; anything else
 * falls back to the given default.
 *
 * A Divi global color (`$variable({..."name":"gcid-xxx"...})$`, what the
 * color-picker stores when a palette color is chosen) can't be resolved to a
 * concrete value here — that's PHP's job on the front-end, via Divi's own
 * API. In the Visual Builder Divi defines each global color as a CSS
 * variable, so it's turned into `var(--gcid-xxx)` instead, which the browser
 * resolves itself. Only a strictly matched id is ever emitted.
 */
/**
 * Twin of D5OSM\CssColor::sanitize_width(): integer border width in px,
 * clamped to 0-20, or `fallback` (e.g. '' = "inherit") when empty/non-numeric.
 */
export function sanitizeBorderWidth(value: unknown, fallback = ''): string {
  const raw = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const num = Number(raw);

  if (raw === '' || Number.isNaN(num)) {
    return fallback;
  }

  return String(Math.max(0, Math.min(20, Math.round(num))));
}

export function sanitizeCssColor(value: unknown, fallback: string): string {
  let color = typeof value === 'string' ? value.trim() : '';

  if (color.startsWith('$variable(')) {
    const id = color.match(/gcid-[a-z0-9_-]+/i);
    color = id ? `var(--${id[0]})` : '';
  }

  if (color === '') {
    return fallback;
  }

  const isHex = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
  const isFunction = /^(?:rgb|hsl)a?\(\s*[0-9.\s,%/deg-]+\)$/i.test(color);
  const isGlobalColorVar = /^var\(--gcid-[a-z0-9_-]+\)$/i.test(color);

  return isHex || isFunction || isGlobalColorVar || color.toLowerCase() === 'transparent' ? color : fallback;
}
