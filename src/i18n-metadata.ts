import { translate as __ } from './translate';

/**
 * Translates a module.json metadata tree client-side before it's handed to
 * `registerModule()`.
 *
 * The Visual Builder's settings panel is built entirely from the metadata
 * object registered here on the JS side (imported straight from module.json
 * at webpack build time) — it never goes through PHP's `block_type_metadata`
 * filter (see includes/ModuleI18n.php), which only affects the *separate*
 * PHP-side module registration used for server-side rendering. Without this,
 * every field label/description stayed in English regardless of site
 * language, no matter how correct the PHP-side translation was.
 *
 * Mirrors ModuleI18n::translate_labels_recursive()'s allow-list of keys —
 * keep the two in sync if either changes.
 */
const TRANSLATABLE_KEYS = new Set([
  'title',
  'titles',
  'childModuleTitle',
  'label',
  'description',
  'groupLabel',
  'fieldLabel',
]);

// Attribute names whose *default value* is genuine display text (shown
// front-end and pre-filled in the Visual Builder), keyed by module name —
// mirrors ModuleI18n::$translatable_defaults.
const TRANSLATABLE_DEFAULTS: Record<string, string[]> = {
  'd5osm/openstreetmap-module-pin': ['readMoreText'],
  'd5osm/openstreetmap-module': ['cptReadmoreText'],
};

function translateLabelsRecursive(node: any): any {
  if (Array.isArray(node)) {
    return node.map(translateLabelsRecursive);
  }
  if (node && typeof node === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(node)) {
      if (TRANSLATABLE_KEYS.has(key) && typeof value === 'string' && value !== '') {
        result[key] = __(value, 'd5-module-openstreetmap');
      } else if (value && typeof value === 'object') {
        result[key] = translateLabelsRecursive(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return node;
}

export function translateMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object' || !metadata.name) {
    return metadata;
  }

  let translated = translateLabelsRecursive(metadata);

  const defaultAttrs = TRANSLATABLE_DEFAULTS[metadata.name] ?? [];
  for (const attrName of defaultAttrs) {
    const current = translated?.attributes?.[attrName]?.default?.innerContent?.desktop?.value;
    if (typeof current === 'string' && current !== '') {
      translated = {
        ...translated,
        attributes: {
          ...translated.attributes,
          [attrName]: {
            ...translated.attributes[attrName],
            default: {
              ...translated.attributes[attrName].default,
              innerContent: {
                ...translated.attributes[attrName].default.innerContent,
                desktop: {
                  ...translated.attributes[attrName].default.innerContent.desktop,
                  value: __(current, 'd5-module-openstreetmap'),
                },
              },
            },
          },
        },
      };
    }
  }

  return translated;
}
