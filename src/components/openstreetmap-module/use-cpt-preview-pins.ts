import { useEffect, useRef, useState } from 'react';
import { OsmLivePin } from './pins-context';
import { getBuilderData } from '../../vb-data';

const val = (attrs: any, path: string, fallback: string): string => {
  const parts = path.split('.');
  let node = attrs;
  for (const part of parts) {
    node = node?.[part];
  }
  return node ?? fallback;
};

/**
 * Fetches the "Custom Post Type Markers" pins for the Visual Builder's live
 * preview map. The parent module's front-end render already builds this
 * exact list server-side (CptMarkersTrait::get_cpt_pins(), via
 * render_callback) — that PHP-side data just isn't reachable from this React
 * component, which only ever sees the block's own saved attrs. A small REST
 * endpoint (CptPreviewController, registered by the PHP side) re-runs the
 * same query/pin-building code so the preview and the published page agree.
 *
 * Debounced: typing in the taxonomy/terms text fields would otherwise fire
 * a request per keystroke.
 */
export function useCptPreviewPins(attrs: any): OsmLivePin[] {
  const [pins, setPins] = useState<OsmLivePin[]>([]);
  const requestIdRef = useRef(0);

  const enabled = val(attrs, 'cptMarkers.innerContent.desktop.value', 'off') === 'on';
  const postType = val(attrs, 'cptPostType.innerContent.desktop.value', '');
  const taxonomy = val(attrs, 'cptTaxonomy.innerContent.desktop.value', '');
  const terms = val(attrs, 'cptTerms.innerContent.desktop.value', '');
  const useExcerpt = val(attrs, 'cptExcerpt.innerContent.desktop.value', 'off') === 'on';
  const showReadmore = val(attrs, 'cptShowReadmore.innerContent.desktop.value', 'on') === 'on';
  const readmoreText = val(attrs, 'cptReadmoreText.innerContent.desktop.value', '');
  const readmoreTarget = val(attrs, 'cptReadmoreTarget.innerContent.desktop.value', '_blank');
  const showThumbs = val(attrs, 'thumbMarkers.innerContent.desktop.value', 'off') === 'on';
  const defaultIcon = val(attrs, 'defaultMarkerIcon.innerContent.desktop.value', 'default');
  const defaultIconUrl = val(attrs, 'defaultMarkerIconUrl.innerContent.desktop.value', '');
  const iconWidth = val(attrs, 'defaultMarkerIconWidth.innerContent.desktop.value', '33');
  const iconHeight = val(attrs, 'defaultMarkerIconHeight.innerContent.desktop.value', '44');

  useEffect(() => {
    if (!enabled || !postType || postType === '#') {
      setPins([]);
      return undefined;
    }

    const preview = getBuilderData().cptPreview;
    if (!preview?.url) {
      // PHP didn't hand over the endpoint (e.g. bundle registered outside
      // the Visual Builder's app window) — nothing to fetch from.
      setPins([]);
      return undefined;
    }

    const thisRequestId = ++requestIdRef.current;

    const timeout = setTimeout(() => {
      const query = new URLSearchParams({
        postType,
        taxonomy,
        terms,
        useExcerpt: String(useExcerpt),
        showReadmore: String(showReadmore),
        readmoreText,
        readmoreTarget,
        showThumbs: String(showThumbs),
        defaultIcon,
        defaultIconUrl,
        iconWidth,
        iconHeight,
      });

      // Plain fetch() with a PHP-computed absolute REST URL (rest_url()),
      // not Divi's shared `apiFetch` instance — we had no way to confirm
      // that instance's root-URL middleware was configured for this site
      // (it 404'd requesting a relative `path` on this subdirectory
      // install, http://host/divicinq/).
      fetch(`${preview.url}?${query.toString()}`, {
        headers: { 'X-WP-Nonce': preview.nonce },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((response: { pins: OsmLivePin[] }) => {
          if (requestIdRef.current === thisRequestId) {
            setPins(response?.pins ?? []);
          }
        })
        .catch(() => {
          if (requestIdRef.current === thisRequestId) {
            setPins([]);
          }
        });
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    enabled,
    postType,
    taxonomy,
    terms,
    useExcerpt,
    showReadmore,
    readmoreText,
    readmoreTarget,
    showThumbs,
    defaultIcon,
    defaultIconUrl,
    iconWidth,
    iconHeight,
  ]);

  return pins;
}
