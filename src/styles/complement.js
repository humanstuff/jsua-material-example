import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';

export default function complement() {
  return [
    el => material.background.accent({ backgroundColor: colors.secondary, shade: 'A100' })(el),
    material.color({ color: 'Black', opacity: 0.54 }),
    material.card()
  ];
}
