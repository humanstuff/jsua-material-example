import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';

export default function table() {
  return [
    material.textInput({ theme: 'light', focusColor: colors.primary })
  ];
}
