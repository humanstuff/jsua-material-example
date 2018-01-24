var lynx = require('@lynx-json/jsua-lynx');
import * as style from '@lynx-json/jsua-style';

function isLabelFor(name) {
  return function (element) {
    return style.hasToken(element, "data-jsua-label-for", name);
  };
}

function isPage() {
  return el => el.parentElement.matches('[data-jsua-context~=app]')
    && el.matches('[data-lynx-hints~=container], [data-lynx-hints~=form]')
    && !el.matches('[data-lynx-hints~=set], [data-lynx-hints~=group], [data-lynx-hints~=list], [data-lynx-hints~=table]');
}

export default Object.assign({
  isLabelFor: isLabelFor,
  isPage: isPage,
  isApplicationRoot: () => el => el.parentElement.matches('[data-jsua-context~=app]'),
  hasStandingLine: () => el => el.hasAttribute("data-jsua-material-standing-line"),
  shouldNegateContainerPadding: () => el => el.hasAttribute('data-jsua-material-negate-padding')
}, style.filters);
