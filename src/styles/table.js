import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';

export default function table() {
  return [
    material.table.auto(),
    material.color({ color: 'Black', opacity: 0.54 })
  ];
}
