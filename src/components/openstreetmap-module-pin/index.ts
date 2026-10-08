import { OpenstreetmapPinModuleEdit } from './edit';
import { PinModuleStyles } from './styles';
import { pinModuleClassnames } from './module-classnames';
import { PinModuleScriptData } from './module-script-data';
import metadata from '../../../includes/modules/OpenStreetMapPin/module.json';

const placeholderContent = {
  module: {
    meta: {
      adminLabel: {
        desktop: {
          value: 'Pin',
        },
      },
    },
  },
};

export const openstreetmapPinModule: any = {
  metadata: metadata,
  placeholderContent: placeholderContent,
  renderers: {
    edit: OpenstreetmapPinModuleEdit,
  },
  parentsName: ['d5osm/openstreetmap-module'],
};
