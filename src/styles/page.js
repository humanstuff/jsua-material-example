import { media } from '@lynx-json/jsua-style';
import * as material from '@lynx-json/jsua-material';
import mediaQueries from '../media-queries';

export default function page() {
  return [
    material.container(),
    material.padding('16px'),
    media(mediaQueries.all, [
      // TODO: This could have performance/memory implications because it calls adjust,
      // so each time a media query changes, another adjust function is called.
      material.padding.left('16px'),
      material.padding.right('16px')
    ]),
    media(mediaQueries.largeScreen, [
      material.padding.left('15vw'),
      material.padding.right('15vw')
    ])
  ];
}
