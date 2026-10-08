import { omit } from 'lodash';
import { addAction } from '@wordpress/hooks';
import { registerModule } from '@divi/module-library';

import { openstreetmapModule } from './components/openstreetmap-module';
import { openstreetmapPinModule } from './components/openstreetmap-module-pin';
import { translateMetadata } from './i18n-metadata';
import { applyDynamicCptOptions } from './cpt-options';

import './module-icons';

addAction('divi.moduleLibrary.registerModuleLibraryStore.after', 'd5osm', () => {
  const parentMetadata = applyDynamicCptOptions(translateMetadata(openstreetmapModule.metadata));
  registerModule(parentMetadata, omit(openstreetmapModule, 'metadata'));
  registerModule(translateMetadata(openstreetmapPinModule.metadata), omit(openstreetmapPinModule, 'metadata'));
});
