import { OpenstreetmapModuleEdit } from './edit';
import { ModuleStyles } from './styles';
import { moduleClassnames } from './module-classnames';
import { ModuleScriptData } from './module-script-data';
import metadata from '../../../includes/modules/OpenStreetMap/module.json';

const placeholderContent = {
  module: {
    meta: {
      adminLabel: {
        desktop: {
          value: 'OpenStreetMap',
        },
      },
    },
  },
};

export const openstreetmapModule: any = {
  metadata: metadata,
  placeholderContent,
  childrenName: ['d5osm/openstreetmap-module-pin'],
  template: [
    ['d5osm/openstreetmap-module-pin', {}],
  ],
  renderers: {
    edit: OpenstreetmapModuleEdit,
  },
};
