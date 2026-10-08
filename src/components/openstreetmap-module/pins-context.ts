import { createContext, useContext } from 'react';

/**
 * Shape of one marker, mirrored from what the PHP render callbacks
 * (parent + Pin child) build for the front-end map init script
 * (see assets/scripts/d5osm-map-init.js).
 */
export interface OsmLivePin {
  latitude: number;
  longitude: number;
  title: string;
  content: string;
  icon: string;
  iconUrl: string;
  iconWidth: number;
  iconHeight: number;
  showReadMore: boolean;
  readMoreText: string;
  readMoreClass: string;
  // Per-pin sidebar colour overrides — empty/undefined means "use the map's"
  // (CPT pins never set them).
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  sidebarButtonBgColor?: string;
  sidebarButtonBorderColor?: string;
  sidebarButtonBorderWidth?: string;
  sidebarButtonTextColor?: string;
}

export interface OsmPinsContextValue {
  registerPin: (id: string, pin: OsmLivePin) => void;
  unregisterPin: (id: string) => void;
}

/**
 * Lets an OpenStreetMap Pin child module (edit.tsx) report its own live
 * attributes up to the parent OpenStreetMap module, so the parent's
 * Visual Builder preview can plot every pin on a real Leaflet map as the
 * user edits them — without depending on any Divi core store internals.
 */
export const OsmPinsContext = createContext<OsmPinsContextValue | null>(null);

export const useOsmPinsContext = (): OsmPinsContextValue | null => useContext(OsmPinsContext);
