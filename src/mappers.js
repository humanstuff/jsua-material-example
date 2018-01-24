var lynx = require('@lynx-json/jsua-lynx');
import * as style from '@lynx-json/jsua-style';

function mapLabel(el) {
  var labeledBy = el.getAttribute('data-lynx-labeled-by');
  if (!labeledBy) return;

  var labelViewSelector = `[data-lynx-name=${labeledBy}]`;
  return lynx.util.findNearestView(el, labelViewSelector);
}

export default Object.assign({
  label: () => mapLabel,
  headers: () => style.mappers.realChildren('[data-lynx-hints~=header]', '[data-lynx-hints~=content]'),
  footers: () => style.mappers.realChildren('[data-lynx-hints~=footer]', '[data-lynx-hints~=content]'),
  realChildren: selector => style.mappers.realChildren(selector, '[data-lynx-hints~=content]'),
  realParent: selector => style.mappers.realParent(selector, '[data-lynx-hints~=content]')
}, style.mappers);
