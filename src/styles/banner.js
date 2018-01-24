import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';

export default function banner() {
  return [
    colors.updateFromBanner(),
    el => material.background.primary({ backgroundColor: colors.primary })(el),
    // TODO: Replace with contrast
    material.color({ color: 'White' }),
    material.header(),
    material.negateContainerPadding(),
    material.elevation.appBar(),
    el => el.style.paddingLeft = '16px',
    el => el.style.paddingRight = '16px',
    el => el.style.minHeight = '64px'
  ];
}
