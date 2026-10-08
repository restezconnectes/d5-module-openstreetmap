import React, { ReactElement, useEffect } from 'react';
import { translate as __ } from '../../translate';
import { ModuleContainer } from '@divi/module';
import { PinModuleStyles } from './styles';
import { pinModuleClassnames } from './module-classnames';
import { PinModuleScriptData } from './module-script-data';
import { useOsmPinsContext } from '../openstreetmap-module/pins-context';
import { LocationSearchField } from './location-search';
import { sanitizeBorderWidth, sanitizeCssColor } from '../../css-color';

const val = (attrs: any, path: string, fallback: string): string => {
  const parts = path.split('.');
  let node = attrs;
  for (const part of parts) {
    node = node?.[part];
  }
  return node ?? fallback;
};

export const OpenstreetmapPinModuleEdit = (props: any): ReactElement => {
  const {
    attrs,
    elements,
    id,
    name,
  } = props;

  const pinTitle = val(attrs, 'pinTitle.innerContent.desktop.value', '');
  const pinLat = val(attrs, 'pinLatitude.innerContent.desktop.value', '47.4');
  const pinLng = val(attrs, 'pinLongitude.innerContent.desktop.value', '1.6');

  const pinsContext = useOsmPinsContext();

  // Report this pin's live attrs up to the parent OpenStreetMap module so
  // its Visual Builder preview map can plot it — see pins-context.ts.
  useEffect(() => {
    if (!pinsContext) {
      return undefined;
    }

    pinsContext.registerPin(id, {
      latitude: parseFloat(pinLat),
      longitude: parseFloat(pinLng),
      title: pinTitle,
      content: val(attrs, 'pinContent.innerContent.desktop.value', ''),
      icon: val(attrs, 'pinIcon.innerContent.desktop.value', 'default'),
      iconUrl: val(attrs, 'pinIconUrl.innerContent.desktop.value', ''),
      iconWidth: parseInt(val(attrs, 'pinIconWidth.innerContent.desktop.value', '33'), 10),
      iconHeight: parseInt(val(attrs, 'pinIconHeight.innerContent.desktop.value', '44'), 10),
      showReadMore: val(attrs, 'showReadMore.innerContent.desktop.value', 'on') === 'on',
      readMoreText: val(attrs, 'readMoreText.innerContent.desktop.value', 'Read More...'),
      readMoreClass: val(attrs, 'readMoreClass.innerContent.desktop.value', ''),
      // Empty string when unset → the parent keeps the map's own colour.
      sidebarBgColor: sanitizeCssColor(val(attrs, 'pinSidebarBgColor.innerContent.desktop.value', ''), ''),
      sidebarTextColor: sanitizeCssColor(val(attrs, 'pinSidebarTextColor.innerContent.desktop.value', ''), ''),
      sidebarButtonBgColor: sanitizeCssColor(val(attrs, 'pinSidebarButtonBgColor.innerContent.desktop.value', ''), ''),
      sidebarButtonBorderColor: sanitizeCssColor(val(attrs, 'pinSidebarButtonBorderColor.innerContent.desktop.value', ''), ''),
      sidebarButtonBorderWidth: sanitizeBorderWidth(val(attrs, 'pinSidebarButtonBorderWidth.innerContent.desktop.value', '')),
      sidebarButtonTextColor: sanitizeCssColor(val(attrs, 'pinSidebarButtonTextColor.innerContent.desktop.value', ''), ''),
    });

    return () => {
      pinsContext.unregisterPin(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-register whenever any relevant attr value changes.
  }, [
    pinsContext,
    id,
    pinTitle,
    pinLat,
    pinLng,
    val(attrs, 'pinContent.innerContent.desktop.value', ''),
    val(attrs, 'pinIcon.innerContent.desktop.value', 'default'),
    val(attrs, 'pinIconUrl.innerContent.desktop.value', ''),
    val(attrs, 'pinIconWidth.innerContent.desktop.value', '33'),
    val(attrs, 'pinIconHeight.innerContent.desktop.value', '44'),
    val(attrs, 'showReadMore.innerContent.desktop.value', 'on'),
    val(attrs, 'readMoreText.innerContent.desktop.value', __('Read More...', 'd5-module-openstreetmap')),
    val(attrs, 'readMoreClass.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarBgColor.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarTextColor.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarButtonBgColor.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarButtonBorderColor.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarButtonBorderWidth.innerContent.desktop.value', ''),
    val(attrs, 'pinSidebarButtonTextColor.innerContent.desktop.value', ''),
  ]);

  return (
    <ModuleContainer
      attrs={attrs}
      elements={elements}
      id={id}
      name={name}
      stylesComponent={PinModuleStyles}
      classnamesFunction={pinModuleClassnames}
      scriptDataComponent={PinModuleScriptData}
    >
      {elements.styleComponents({
        attrName: 'module',
      })}
      <div
        className="d5osm_pin_item"
        style={{
          padding: '8px 12px',
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '16px' }}>📍</span>
          <span style={{ fontWeight: 600 }}>
            {pinTitle || __('Pin', 'd5-module-openstreetmap')}
          </span>
          <span style={{ color: '#718096', fontSize: '11px' }}>
            ({pinLat}, {pinLng})
          </span>
        </div>
        <LocationSearchField />
      </div>
    </ModuleContainer>
  );
};
