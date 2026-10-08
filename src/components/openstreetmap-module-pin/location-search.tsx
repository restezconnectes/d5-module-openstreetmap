import React, { useEffect, useRef, useState } from 'react';
import { translate as __ } from '../../translate';

declare global {
  interface Window {
    L?: any;
  }
}

interface Suggestion {
  text: string;
  unformattedText: string;
  magicKey: string;
}

type Status = 'idle' | 'loading' | 'error' | 'not-open';

/**
 * Sets an <input>'s value the same way a real keystroke would, so that
 * whatever framework owns the field (here, Divi's own field component)
 * picks up the change through its normal `input`/`change` listeners.
 * Setting `.value` directly wouldn't be enough: React (and most other UI
 * libraries) tracks the DOM property via its own setter, which a plain
 * assignment bypasses — the framework never notices the value "changed".
 */
function setNativeInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Fills the Pin module's own Latitude/Longitude settings-panel fields.
 *
 * Divi 5 gives a module's canvas-render component (this one) no official
 * way to update its own attributes — none of the props Divi hands to
 * `edit.tsx` expose a setter (confirmed by inspecting them directly; see
 * STRUCTURE.md). This works around that by writing straight to the native
 * settings-panel `<input>` elements Divi itself renders, found by their
 * predictable DOM id (`et-vb-field-input-text-{attrName}-innerContent` —
 * confirmed by inspecting a real field in the browser) and dispatching real
 * `input`/`change` events, exactly as if the editor had typed the value.
 *
 * Only works while that settings panel is actually open and rendered —
 * returns false otherwise, so the caller can tell the editor to open it.
 */
function fillPinCoordinates(lat: number, lng: number): boolean {
  const latInput = document.getElementById('et-vb-field-input-text-pinLatitude-innerContent') as HTMLInputElement | null;
  const lngInput = document.getElementById('et-vb-field-input-text-pinLongitude-innerContent') as HTMLInputElement | null;

  if (!latInput || !lngInput) {
    return false;
  }

  setNativeInputValue(latInput, String(lat));
  setNativeInputValue(lngInput, String(lng));
  latInput.dispatchEvent(new Event('blur', { bubbles: true }));
  lngInput.dispatchEvent(new Event('blur', { bubbles: true }));

  return true;
}

/**
 * Small location-search field rendered in the Pin module's own canvas
 * placeholder. Lets an editor type a place/address and, on picking a
 * suggestion, fills in the pin's Latitude/Longitude fields automatically —
 * reusing the same Esri geocoder already loaded for the parent module's own
 * "Display Search" control (d5_osm_leaflet_esri_js/d5_osm_leafletgeocoderjs),
 * but through its low-level suggest()/geocode() API directly, since this
 * doesn't run on an actual Leaflet map.
 */
export const LocationSearchField = (): React.ReactElement => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<any>(null);

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const getProvider = (): any => {
    const L = window.L;
    if (!L?.esri?.Geocoding) {
      return null;
    }
    if (!providerRef.current) {
      providerRef.current = L.esri.Geocoding.arcgisOnlineProvider({ maxResults: 5 });
    }
    return providerRef.current;
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setStatus('idle');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const provider = getProvider();
      if (!provider) {
        setSuggestions([]);
        return;
      }
      setStatus('loading');
      provider.suggestions(value, null, (error: unknown, results: Suggestion[]) => {
        setStatus('idle');
        setSuggestions(error ? [] : results);
      });
    }, 350);
  };

  const handleSelect = (suggestion: Suggestion) => {
    const provider = getProvider();
    if (!provider) {
      return;
    }
    setStatus('loading');
    provider.results(
      suggestion.unformattedText,
      suggestion.magicKey,
      null,
      (error: unknown, results: Array<{ latlng: { lat: number; lng: number } }>) => {
        if (error || !results?.length) {
          setStatus('error');
          return;
        }
        const { lat, lng } = results[0].latlng;
        const filled = fillPinCoordinates(lat, lng);
        setStatus(filled ? 'idle' : 'not-open');
        setSuggestions([]);
        setQuery(filled ? suggestion.text : query);
      },
    );
  };

  return (
    <div
      style={{ position: 'relative', marginBottom: '6px' }}
      // Keep clicks/typing here from also selecting/dragging the module in
      // the canvas behind it.
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={__('Search a place to fill in coordinates…', 'd5-module-openstreetmap')}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontSize: '12px',
          padding: '4px 6px',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
        }}
      />
      {suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 10,
            left: 0,
            right: 0,
            margin: '2px 0 0',
            padding: 0,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            maxHeight: '160px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.magicKey}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
              style={{
                padding: '4px 6px',
                fontSize: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f1f1',
              }}
            >
              {suggestion.text}
            </li>
          ))}
        </ul>
      )}
      {status === 'not-open' && (
        <div style={{ fontSize: '11px', color: '#c0392b', marginTop: '2px' }}>
          {__('Open this pin\'s settings panel first, then pick a search result.', 'd5-module-openstreetmap')}
        </div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: '11px', color: '#c0392b', marginTop: '2px' }}>
          {__('Could not find coordinates for that place.', 'd5-module-openstreetmap')}
        </div>
      )}
    </div>
  );
};
