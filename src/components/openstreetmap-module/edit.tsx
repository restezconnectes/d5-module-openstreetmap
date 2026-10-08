import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { translate as __ } from '../../translate';
import { ChildModulesContainer, ModuleContainer } from '@divi/module';
import { ModuleStyles } from './styles';
import { moduleClassnames } from './module-classnames';
import { ModuleScriptData } from './module-script-data';
import { OsmLivePin, OsmPinsContext } from './pins-context';
import { useLeafletPreviewMap } from './use-leaflet-preview-map';
import { useCptPreviewPins } from './use-cpt-preview-pins';
import { sanitizeBorderWidth, sanitizeCssColor } from '../../css-color';

const val = (attrs: any, path: string, fallback: string): string => {
  const parts = path.split('.');
  let node = attrs;
  for (const part of parts) {
    node = node?.[part];
  }
  return node ?? fallback;
};

export const OpenstreetmapModuleEdit = (props: any): ReactElement => {
  const {
    attrs,
    elements,
    id,
    name,
    childrenIds,
  } = props;

  const mapHeight = val(attrs, 'mapHeight.innerContent.desktop.value', '350');
  const [pins, setPins] = useState<Record<string, OsmLivePin>>({});

  const registerPin = useCallback((pinId: string, pin: OsmLivePin) => {
    setPins((prev) => ({ ...prev, [pinId]: pin }));
  }, []);

  const unregisterPin = useCallback((pinId: string) => {
    setPins((prev) => {
      if (!(pinId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[pinId];
      return next;
    });
  }, []);

  const contextValue = useMemo(() => ({ registerPin, unregisterPin }), [registerPin, unregisterPin]);

  const config = useMemo(() => ({
    latitude: parseFloat(val(attrs, 'latitude.innerContent.desktop.value', '47.4')),
    longitude: parseFloat(val(attrs, 'longitude.innerContent.desktop.value', '1.6')),
    zoom: parseFloat(val(attrs, 'zoom.innerContent.desktop.value', '5.5')),
    baseLayer: val(attrs, 'baseLayer.innerContent.desktop.value', 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
    showZoomControls: val(attrs, 'showZoomControls.innerContent.desktop.value', 'on') === 'on',
    scrollWheelZoom: val(attrs, 'scrollWheelZoom.innerContent.desktop.value', 'off') === 'on',
    doubleClickZoom: val(attrs, 'doubleClickZoom.innerContent.desktop.value', 'off') === 'on',
    minZoom: parseInt(val(attrs, 'minZoom.innerContent.desktop.value', '0'), 10),
    maxZoom: parseInt(val(attrs, 'maxZoom.innerContent.desktop.value', '18'), 10),
    fitMarkers: val(attrs, 'fitMarkers.innerContent.desktop.value', 'off') === 'on',
    controlLayers: val(attrs, 'controlLayers.innerContent.desktop.value', 'off') === 'on',
    displaySearch: val(attrs, 'displaySearch.innerContent.desktop.value', 'off') === 'on',
    searchColor: attrs?.searchMarkerColor?.decoration?.background?.desktop?.value?.color ?? '#fe6c58',
    displayMinimap: val(attrs, 'displayMinimap.innerContent.desktop.value', 'off') === 'on',
    displayLocation: val(attrs, 'displayLocation.innerContent.desktop.value', 'off') === 'on',
    displayHomeButton: val(attrs, 'displayHomeButton.innerContent.desktop.value', 'off') === 'on',
    displaySidebar: val(attrs, 'displaySidebar.innerContent.desktop.value', 'off') === 'on',
    sidebarBgColor: sanitizeCssColor(val(attrs, 'sidebarBgColor.innerContent.desktop.value', ''), '#ffffff'),
    sidebarTextColor: sanitizeCssColor(val(attrs, 'sidebarTextColor.innerContent.desktop.value', ''), '#333333'),
    sidebarButtonBgColor: sanitizeCssColor(val(attrs, 'sidebarButtonBgColor.innerContent.desktop.value', ''), '#0052b1'),
    sidebarButtonBorderColor: sanitizeCssColor(val(attrs, 'sidebarButtonBorderColor.innerContent.desktop.value', ''), '#0052b1'),
    sidebarButtonBorderWidth: sanitizeBorderWidth(val(attrs, 'sidebarButtonBorderWidth.innerContent.desktop.value', ''), '1'),
    sidebarButtonTextColor: sanitizeCssColor(val(attrs, 'sidebarButtonTextColor.innerContent.desktop.value', ''), '#ffffff'),
    defaultIcon: val(attrs, 'defaultMarkerIcon.innerContent.desktop.value', 'default'),
    defaultIconUrl: val(attrs, 'defaultMarkerIconUrl.innerContent.desktop.value', ''),
    defaultIconWidth: parseInt(val(attrs, 'defaultMarkerIconWidth.innerContent.desktop.value', '33'), 10),
    defaultIconHeight: parseInt(val(attrs, 'defaultMarkerIconHeight.innerContent.desktop.value', '44'), 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- computed straight from attrs below.
  }), [attrs]);

  const cptPins = useCptPreviewPins(attrs);
  const pinsList = useMemo(() => [...Object.values(pins), ...cptPins], [pins, cptPins]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { ready, sidebar } = useLeafletPreviewMap(mapContainerRef, config, pinsList);
  const leafletAvailable = ready;

  return (
    <ModuleContainer
      attrs={attrs}
      elements={elements}
      id={id}
      name={name}
      stylesComponent={ModuleStyles}
      classnamesFunction={moduleClassnames}
      scriptDataComponent={ModuleScriptData}
    >
      {elements.styleComponents({
        attrName: 'module',
      })}
      <div
        className={`d5osm_map_wrapper${sidebar.open ? ' d5osm_sidebar_active' : ''}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          // Same CSS variables the front-end sets on its own wrapper (see
          // d5osm-map-init.js's setupSidebar()), consumed by d5osm-overrides.css.
          // The open pin's own colours (if set) win over the map's.
          ['--d5osm-sidebar-bg' as string]: sidebar.pin?.sidebarBgColor || config.sidebarBgColor,
          ['--d5osm-sidebar-text' as string]: sidebar.pin?.sidebarTextColor || config.sidebarTextColor,
          ['--d5osm-sidebar-btn-bg' as string]: sidebar.pin?.sidebarButtonBgColor || config.sidebarButtonBgColor,
          ['--d5osm-sidebar-btn-border' as string]: sidebar.pin?.sidebarButtonBorderColor || config.sidebarButtonBorderColor,
          ['--d5osm-sidebar-btn-border-width' as string]: `${sidebar.pin?.sidebarButtonBorderWidth || config.sidebarButtonBorderWidth}px`,
          ['--d5osm-sidebar-btn-text' as string]: sidebar.pin?.sidebarButtonTextColor || config.sidebarButtonTextColor,
        }}
      >
        {config.displaySidebar && (
          <div className="d5osm_sidebar">
            <button
              type="button"
              className="d5osm_sidebar_close"
              aria-label={__('Close', 'd5-module-openstreetmap')}
              title={__('Close', 'd5-module-openstreetmap')}
              onClick={sidebar.close}
            >
              &times;
            </button>
            {/* Marker content is already-sanitized HTML we build ourselves
                from pin attrs (see the marker-building effect) — same trust
                boundary as the front-end popup it replaces. */}
            <div
              className="d5osm_sidebar_content"
              /* eslint-disable-next-line react/no-danger */
              dangerouslySetInnerHTML={{ __html: sidebar.content }}
            />
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="d5osm_map_container"
          style={{
            height: `${mapHeight}px`,
            position: 'relative',
            background: leafletAvailable ? undefined : '#e0e7ed',
            border: leafletAvailable ? undefined : '2px dashed #8c9ba5',
            borderRadius: '4px',
          }}
        >
          {!leafletAvailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#4a5568',
            fontSize: '14px',
            padding: '20px',
          }}
          >
            <div>
              <div style={{ marginBottom: '12px', fontSize: '24px' }}>🗺️</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                OpenStreetMap
              </div>
              <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>
                {__('Lat:', 'd5-module-openstreetmap')} {config.latitude}, {__('Lng:', 'd5-module-openstreetmap')} {config.longitude}
              </div>
              <div style={{ fontSize: '13px', color: '#718096' }}>
                {__('Zoom:', 'd5-module-openstreetmap')} {config.zoom}
              </div>
              <div style={{ fontSize: '11px', marginTop: '12px', color: '#a0aec0', fontStyle: 'italic' }}>
                {__('Preview unavailable in this browser session — the map renders on the frontend.', 'd5-module-openstreetmap')}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      {/*
        Pins now render live on the map above (see pins-context.ts), so the
        per-pin rows are just noise here. Still mounted (not removed) so the
        Pin children keep reporting into the context, keep their Layers-panel
        entries, and stay reachable for add/reorder/select.
      */}
      <div style={{ display: 'none' }}>
        <OsmPinsContext.Provider value={contextValue}>
          <ChildModulesContainer ids={childrenIds} />
        </OsmPinsContext.Provider>
      </div>
    </ModuleContainer>
  );
};
