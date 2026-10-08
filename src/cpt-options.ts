import { getBuilderData } from './vb-data';

/**
 * Builds the `divi/select` options object for the "Custom Post Type" field,
 * from the list of public post types handed to the app window by PHP (see
 * D5ModuleOpenstreetmap.php's `data_app_window` — read via vb-data.ts).
 * Falls back to just the placeholder if that data isn't available yet
 * (front-end/SSR context, or a request that isn't the VB).
 */
export function getCptPostTypeOptions(): Record<string, { label: string }> {
  return buildOptionsFromDictionary(getBuilderData().cptTypes);
}

/**
 * Same idea as getCptPostTypeOptions(), for the "Filter by Taxonomy" field —
 * see D5ModuleOpenstreetmap.php's `cptTaxonomies` data. Restores the Divi 4
 * module's convenience of picking a real taxonomy from a dropdown instead
 * of typing its slug by hand.
 */
export function getCptTaxonomyOptions(): Record<string, { label: string }> {
  return buildOptionsFromDictionary(getBuilderData().cptTaxonomies);
}

function buildOptionsFromDictionary(dict?: Record<string, string>): Record<string, { label: string }> {
  const options: Record<string, { label: string }> = {
    '': { label: 'Choose' },
  };

  if (dict) {
    Object.entries(dict).forEach(([slug, label]) => {
      options[slug] = { label };
    });
  }

  return options;
}

/**
 * Returns a copy of a field's metadata item with its `divi/select` options
 * replaced by the given dictionary — shared by applyDynamicCptOptions() for
 * both the "Custom Post Type" and "Filter by Taxonomy" fields.
 */
function withDynamicSelectOptions(metadata: any, attrName: string, options: Record<string, { label: string }>): any {
  const item = metadata?.attributes?.[attrName]?.settings?.innerContent?.item;
  if (!item) {
    return metadata;
  }

  return {
    ...metadata,
    attributes: {
      ...metadata.attributes,
      [attrName]: {
        ...metadata.attributes[attrName],
        settings: {
          ...metadata.attributes[attrName].settings,
          innerContent: {
            ...metadata.attributes[attrName].settings.innerContent,
            item: {
              ...item,
              component: {
                ...item.component,
                props: {
                  ...item.component?.props,
                  options,
                },
              },
            },
          },
        },
      },
    },
  };
}

/**
 * Returns a copy of the parent module's metadata with the "Custom Post
 * Type" and "Filter by Taxonomy" select fields' options replaced by the
 * real, site-specific lists (module.json's own options are just a "Choose"
 * placeholder — only meaningful for the parent OpenStreetMap module).
 */
export function applyDynamicCptOptions(metadata: any): any {
  let result = withDynamicSelectOptions(metadata, 'cptPostType', getCptPostTypeOptions());
  result = withDynamicSelectOptions(result, 'cptTaxonomy', getCptTaxonomyOptions());
  return result;
}
