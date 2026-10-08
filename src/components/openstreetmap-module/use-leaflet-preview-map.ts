import { RefObject, useEffect, useRef, useState } from 'react';
import { translate as __ } from '../../translate';
import { OsmLivePin } from './pins-context';

export interface LeafletPreviewConfig {
  latitude: number;
  longitude: number;
  zoom: number;
  baseLayer: string;
  showZoomControls: boolean;
  scrollWheelZoom: boolean;
  doubleClickZoom: boolean;
  minZoom: number;
  maxZoom: number;
  fitMarkers: boolean;
  controlLayers: boolean;
  displaySearch: boolean;
  searchColor: string;
  displayMinimap: boolean;
  displayLocation: boolean;
  displayHomeButton: boolean;
  displaySidebar: boolean;
  defaultIcon: string;
  defaultIconUrl: string;
  defaultIconWidth: number;
  defaultIconHeight: number;
}

declare global {
  interface Window {
    L?: any;
    d5osm_vars?: { imagesUrl?: string };
  }
}

function getIconUrl(iconName: string, customUrl: string): string {
  if (customUrl) {
    return customUrl;
  }
  const baseUrl = window.d5osm_vars?.imagesUrl || '';
  return `${baseUrl}${iconName || 'default'}.png`;
}

function createIcon(L: any, iconUrl: string, width: number, height: number) {
  return L.icon({
    iconUrl,
    iconSize: [width || 33, height || 44],
    iconAnchor: [(width || 33) / 2, height || 44],
    popupAnchor: [0, -(height || 44)],
  });
}

const BASE_LAYER_PRESETS: Array<[string, string]> = [
  ['OSM Mapnik', 'https://{s}.tile.osm.org/{z}/{x}/{y}.png'],
  ['OpenStreetMap France', 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'],
  ['OpenStreetMap HOT', 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
  ['Satellite', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  ['Cycle OSM', 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],
];

/**
 * Initializes and keeps a real Leaflet map in sync inside a Visual Builder
 * edit.tsx preview, mirroring assets/scripts/d5osm-map-init.js (the
 * front-end init script) so editors see roughly what will be published.
 *
 * Degrades gracefully: if Leaflet (`window.L`) isn't available in this
 * window — e.g. the app-window dependency chain didn't load for some
 * reason — this is a no-op and the caller should keep showing its
 * placeholder instead.
 */
export interface LeafletPreviewSidebar {
  open: boolean;
  content: string;
  // The pin whose info is shown — its optional colour overrides win over the map's.
  pin: OsmLivePin | null;
  close: () => void;
}

export function useLeafletPreviewMap(
  containerRef: RefObject<HTMLDivElement>,
  config: LeafletPreviewConfig,
  pins: OsmLivePin[],
): { ready: boolean; sidebar: LeafletPreviewSidebar } {
  const mapRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [sidebarState, setSidebarState] = useState<{ open: boolean; content: string; pin: OsmLivePin | null }>({
    open: false,
    content: '',
    pin: null,
  });
  const closeSidebar = () => setSidebarState((s) => ({ ...s, open: false }));
  // Bumped every time a *new* L.map() instance is created. The Visual
  // Builder can tear down and recreate this component's container even
  // though our own config props haven't changed — effects that only
  // depend on config values would then silently skip re-populating the
  // brand new map (this is what caused the base layer to go missing:
  // the map was recreated, but the base-layer effect's deps hadn't
  // changed, so React never re-ran it against the new map instance).
  const [mapGeneration, setMapGeneration] = useState(0);
  // Base layer + optional layer-switcher control state — declared up here
  // (rather than next to the effect that owns them) so the init effect's
  // cleanup can reset them without relying on hoisting/closure order.
  const namedBaseLayersRef = useRef<Record<string, any> | null>(null);
  const baseLayersByUrlRef = useRef<Record<string, any> | null>(null);
  const activeBaseLayerRef = useRef<any>(null);
  const layersControlRef = useRef<any>(null);
  const homeControlRef = useRef<any>(null);
  const locateControlRef = useRef<any>(null);
  const locateLayersRef = useRef<any>(null);
  const locateHandlersRef = useRef<{ onFound: (e: any) => void; onError: () => void } | null>(null);
  const zoomControlRef = useRef<any>(null);

  // Leaflet is loaded as a separate WP script dependency of our bundle; on
  // a slow connection it can still be mid-flight on first render. Poll
  // briefly instead of giving up after a single check.
  const [leafletTick, setLeafletTick] = useState(0);
  useEffect(() => {
    if (window.L) {
      return undefined;
    }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (window.L || attempts > 25) {
        clearInterval(interval);
        setLeafletTick((t) => t + 1);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Init once Leaflet + the container are available.
  useEffect(() => {
    const L = window.L;
    if (!L || !containerRef.current || mapRef.current) {
      return undefined;
    }

    // zoomControl stays disabled here: Leaflet's own default L.Control.Zoom has
    // "Zoom in"/"Zoom out" tooltips hard-coded in English inside leaflet.min.js
    // (unreachable by our translation system, a third-party library). A
    // dedicated effect below adds our own instance instead, with translated
    // titles.
    const map = L.map(containerRef.current, {
      maxZoom: config.maxZoom || 18,
      minZoom: config.minZoom || 0,
      zoomControl: false,
      scrollWheelZoom: config.scrollWheelZoom === true,
      doubleClickZoom: config.doubleClickZoom === true,
    }).setView([config.latitude, config.longitude], config.zoom || 5.5);

    // The base tile layer is added by the dedicated "base layer swap" effect
    // below, which also runs on mount (it depends on config.baseLayer).

    mapRef.current = map;
    setReady(true);
    setMapGeneration((g) => g + 1);

    // Visual Builder panels can change the module's layout after first
    // paint (settings sidebar collapsing/expanding); make sure Leaflet
    // recomputes its size instead of showing a partially-tiled map.
    // Guarded by `destroyed` because the Visual Builder can mount/unmount
    // this component in quick succession — an in-flight timeout firing
    // after `map.remove()` crashes deep inside Leaflet (`_leaflet_pos` of
    // an already-removed pane).
    let destroyed = false;
    const invalidateSizeTimeout = setTimeout(() => {
      if (!destroyed) {
        map.invalidateSize();
      }
    }, 200);

    return () => {
      destroyed = true;
      clearTimeout(invalidateSizeTimeout);
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
      // These are all tied to *this* map instance — force every other
      // effect to rebuild them from scratch for whichever map comes next,
      // instead of skipping work because a stale ref looks "already set".
      namedBaseLayersRef.current = null;
      baseLayersByUrlRef.current = null;
      activeBaseLayerRef.current = null;
      layersControlRef.current = null;
      homeControlRef.current = null;
      locateControlRef.current = null;
      locateLayersRef.current = null;
      locateHandlersRef.current = null;
      zoomControlRef.current = null;
      setReady(false);
      setSidebarState({ open: false, content: '', pin: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per container/leaflet-availability; view/layer updates handled below.
  }, [containerRef.current, leafletTick]);

  // Keep view + zoom/scroll behaviour in sync with the settings panel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setView([config.latitude, config.longitude], config.zoom || 5.5);
    map.setMinZoom(config.minZoom || 0);
    map.setMaxZoom(config.maxZoom || 18);
    map.scrollWheelZoom[config.scrollWheelZoom ? 'enable' : 'disable']();
    map.doubleClickZoom[config.doubleClickZoom ? 'enable' : 'disable']();
  }, [
    mapGeneration,
    config.latitude,
    config.longitude,
    config.zoom,
    config.minZoom,
    config.maxZoom,
    config.scrollWheelZoom,
    config.doubleClickZoom,
  ]);

  // Rebuild markers whenever the pin list or default icon settings change.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) {
      return;
    }

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    if (!pins.length) {
      return;
    }

    const clusterGroup = typeof L.markerClusterGroup === 'function'
      ? L.markerClusterGroup()
      : L.layerGroup();

    const markers: any[] = [];

    pins.forEach((pin) => {
      if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
        return;
      }

      const iconUrl = getIconUrl(
        pin.icon || config.defaultIcon,
        pin.iconUrl || config.defaultIconUrl,
      );
      const icon = createIcon(
        L,
        iconUrl,
        pin.iconWidth || config.defaultIconWidth,
        pin.iconHeight || config.defaultIconHeight,
      );

      const marker = L.marker([pin.latitude, pin.longitude], { icon, title: pin.title || '' });

      let popupContent = '';
      if (pin.title) {
        popupContent += `<strong>${pin.title}</strong>`;
      }
      if (pin.content) {
        popupContent += `<br>${pin.content}`;
      }
      // In the sidebar, "Read More" is a button (same as the front-end) rather
      // than the plain link a popup shows.
      let sidebarContent = popupContent;
      if (pin.showReadMore) {
        const readmoreClass = `d5osm_readmore${pin.readMoreClass ? ` ${pin.readMoreClass}` : ''}`;
        const readmoreText = pin.readMoreText || __('Read More...', 'd5-module-openstreetmap');
        popupContent += `<br><span class="${readmoreClass}">${readmoreText}</span>`;
        sidebarContent += `<span class="${readmoreClass} d5osm_readmore_button">${readmoreText}</span>`;
      }
      if (popupContent) {
        if (config.displaySidebar) {
          marker.on('click', () => setSidebarState({ open: true, content: sidebarContent, pin }));
        } else {
          marker.bindPopup(popupContent);
        }
      }

      markers.push(marker);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    if (config.fitMarkers && markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.5), { maxZoom: config.zoom || 5.5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pins array identity changes on every registerPin call.
  }, [mapGeneration, pins, config.defaultIcon, config.defaultIconUrl, config.defaultIconWidth, config.defaultIconHeight, config.fitMarkers, config.displaySidebar]);

  // Base layer + optional layer-switcher control. Both need to agree on
  // which tile layer object is "the" active one — building two separate
  // sets of L.tileLayer instances (one added directly to the map, another
  // baked into L.control.layers) left the control unaware of the layer
  // that was actually showing, which is what made the base tiles behave
  // unpredictably once "Display Base Layers Control" was enabled.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) {
      return undefined;
    }

    try {
      if (!namedBaseLayersRef.current) {
        const namedBaseLayers: Record<string, any> = {};
        const baseLayersByUrl: Record<string, any> = {};
        BASE_LAYER_PRESETS.forEach(([label, url]) => {
          const layer = L.tileLayer(url);
          namedBaseLayers[label] = layer;
          baseLayersByUrl[url] = layer;
        });
        namedBaseLayersRef.current = namedBaseLayers;
        baseLayersByUrlRef.current = baseLayersByUrl;
      }
      const namedBaseLayers = namedBaseLayersRef.current;
      const baseLayersByUrl = baseLayersByUrlRef.current as Record<string, any>;

      const targetUrl = config.baseLayer || BASE_LAYER_PRESETS[0][1];
      let targetLayer = baseLayersByUrl[targetUrl];
      if (!targetLayer) {
        // Custom URL not among the presets: build an ad-hoc layer for it
        // rather than falling back silently to a different one.
        targetLayer = L.tileLayer(targetUrl);
        baseLayersByUrl[targetUrl] = targetLayer;
        (namedBaseLayers as Record<string, any>)[targetUrl] = targetLayer;
      }

      if (activeBaseLayerRef.current !== targetLayer || !map.hasLayer(targetLayer)) {
        if (activeBaseLayerRef.current && map.hasLayer(activeBaseLayerRef.current)) {
          map.removeLayer(activeBaseLayerRef.current);
        }
        targetLayer.addTo(map);
        targetLayer.bringToBack();
        activeBaseLayerRef.current = targetLayer;
      }

      if (config.controlLayers && !layersControlRef.current) {
        layersControlRef.current = L.control.layers(namedBaseLayers, undefined, { position: 'topright' }).addTo(map);
      } else if (!config.controlLayers && layersControlRef.current) {
        map.removeControl(layersControlRef.current);
        layersControlRef.current = null;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[d5-module-openstreetmap] Failed to sync base layer / layers control', err);
    }

    return undefined;
  }, [mapGeneration, config.baseLayer, config.controlLayers]);

  // Zoom control, added by hand instead of via the map's automatic
  // `zoomControl` option — see the comment on map creation above.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) {
      return undefined;
    }

    const showZoomControls = config.showZoomControls !== false;

    if (showZoomControls && !zoomControlRef.current) {
      zoomControlRef.current = L.control.zoom({
        zoomInTitle: __('Zoom in', 'd5-module-openstreetmap'),
        zoomOutTitle: __('Zoom out', 'd5-module-openstreetmap'),
      });
      zoomControlRef.current.addTo(map);
    } else if (!showZoomControls && zoomControlRef.current) {
      map.removeControl(zoomControlRef.current);
      zoomControlRef.current = null;
    }

    return undefined;
  }, [mapGeneration, config.showZoomControls]);

  // "Home" (reset view) control — mirrors assets/scripts/d5osm-map-init.js's
  // own custom L.Control so editors see it in the preview too.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) {
      return undefined;
    }

    if (config.displayHomeButton && !homeControlRef.current) {
      const HomeControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control d5osm-home-control');
          const link = L.DomUtil.create('a', '', container);
          link.href = '#';
          const homeTitle = __('Reset view', 'd5-module-openstreetmap');
          link.title = homeTitle;
          link.setAttribute('role', 'button');
          link.setAttribute('aria-label', homeTitle);
          link.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">'
            + '<path fill="currentColor" d="M12 3.1 3 10.5V21h6v-6h6v6h6V10.5z"/></svg>';

          L.DomEvent.on(link, 'click', (e: Event) => {
            L.DomEvent.stop(e);
            map.setView([config.latitude, config.longitude], config.zoom || 5.5);
          });

          return container;
        },
      });
      homeControlRef.current = new HomeControl();
      map.addControl(homeControlRef.current);
    } else if (!config.displayHomeButton && homeControlRef.current) {
      map.removeControl(homeControlRef.current);
      homeControlRef.current = null;
    }

    return undefined;
  }, [mapGeneration, config.displayHomeButton, config.latitude, config.longitude, config.zoom]);

  // Geolocation control — mirrors assets/scripts/d5osm-map-init.js's own
  // custom L.Control (icon, active-state toggle, pulsing dot + accuracy
  // circle) so editors see the same button in the Visual Builder preview.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) {
      return undefined;
    }

    if (config.displayLocation && !locateControlRef.current) {
      const locateLayers = new L.FeatureGroup();
      locateLayersRef.current = locateLayers;
      let locateLink: any = null;

      const onFound = (e: any) => {
        locateLayers.clearLayers();
        L.circle(e.latlng, {
          radius: e.accuracy / 2,
          weight: 2,
          stroke: false,
          fillColor: '#136aec',
          fillOpacity: 0.15,
        }).addTo(locateLayers);
        L.marker(e.latlng, {
          icon: L.divIcon({ className: 'd5osm-located-animation', iconSize: L.point(17, 17) }),
        }).addTo(locateLayers);
        locateLayers.addTo(map);
      };
      // Silent in the preview — no legend clutter in the small edit canvas
      // (the front-end still shows one, see d5osm-map-init.js).
      const onError = () => {};
      locateHandlersRef.current = { onFound, onError };

      const toggleLocate = () => {
        const active = L.DomUtil.hasClass(locateLink, 'd5osm-locate-active');
        if (active) {
          L.DomUtil.removeClass(locateLink, 'd5osm-locate-active');
          map.stopLocate();
          map.off('locationfound', onFound);
          map.off('locationerror', onError);
          map.removeLayer(locateLayers);
          return;
        }
        L.DomUtil.addClass(locateLink, 'd5osm-locate-active');
        map.on('locationfound', onFound);
        map.on('locationerror', onError);
        map.locate({ setView: true, enableHighAccuracy: true });
      };

      const LocateControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control d5osm-locate-button');
          locateLink = L.DomUtil.create('a', '', container);
          locateLink.href = '#';
          const locateTitle = __('Locate me', 'd5-module-openstreetmap');
          locateLink.title = locateTitle;
          locateLink.setAttribute('role', 'button');
          locateLink.setAttribute('aria-label', locateTitle);
          locateLink.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">'
            + '<path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';

          L.DomEvent.on(locateLink, 'click', (e: Event) => {
            L.DomEvent.stop(e);
            toggleLocate();
          });

          return container;
        },
      });

      locateControlRef.current = new LocateControl();
      map.addControl(locateControlRef.current);
    } else if (!config.displayLocation && locateControlRef.current) {
      map.stopLocate();
      if (locateHandlersRef.current) {
        map.off('locationfound', locateHandlersRef.current.onFound);
        map.off('locationerror', locateHandlersRef.current.onError);
        locateHandlersRef.current = null;
      }
      if (locateLayersRef.current) {
        map.removeLayer(locateLayersRef.current);
        locateLayersRef.current = null;
      }
      map.removeControl(locateControlRef.current);
      locateControlRef.current = null;
    }

    return undefined;
  }, [mapGeneration, config.displayLocation]);

  return {
    ready,
    sidebar: {
      open: sidebarState.open,
      content: sidebarState.content,
      pin: sidebarState.pin,
      close: closeSidebar,
    },
  };
}
