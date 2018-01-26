import * as material from '@lynx-json/jsua-material';
import { map } from '@lynx-json/jsua-style';

export default function () {
  var theme = 'light';

  return [
    map(() => document.body, [
      material.text(),
      material.background.main({ theme: theme }),
      material.color({ theme: theme })
    ])
  ];
}
