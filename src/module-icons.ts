import { addFilter } from '@wordpress/hooks';
import {
  moduleOpenstreetmap,
} from './icons';

// Add module icons to the icon library.
addFilter('divi.iconLibrary.icon.map', 'd5osm', (icons) => {
  return {
    ...icons, // This is important. Without this, all other icons will be overwritten.
    [moduleOpenstreetmap.name]: moduleOpenstreetmap,
  };
});
