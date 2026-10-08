import { getBuilderData } from './vb-data';

/**
 * Self-contained replacement for `@wordpress/i18n`'s `__()`.
 *
 * We tried relying on `wp_set_script_translations()` + Divi's shared
 * `vendor.wp.i18n` instance first, but couldn't get concrete proof it was
 * ever actually loading a catalog in the Visual Builder's app window (no
 * verified network request, no verified effect — the module.json labels
 * stayed in English through several fix attempts around hook timing).
 * We then tried building the translation map in PHP and handing it over via
 * a separate `wp_localize_script()` call (`window.d5osmTranslations`) — this
 * *also* never reached the app window in practice (confirmed empty in the
 * Visual Builder's own console). See vb-data.ts for the mechanism that
 * finally worked: Divi 5's own `data_app_window` channel.
 */
export function translate(text: string, ..._domain: unknown[]): string {
  const dict = getBuilderData().translations;
  if (dict && Object.prototype.hasOwnProperty.call(dict, text)) {
    return dict[text];
  }
  return text;
}
