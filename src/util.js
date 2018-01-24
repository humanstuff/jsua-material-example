var lynx = require('@lynx-json/jsua-lynx');
import { context, map, addToken, lock } from '@lynx-json/jsua-style';
import mappers from './mappers';

function classifyLabel(name) {
  return map(mappers.label(), el => addToken(el, 'data-jsua-label-for', name));
}

export function lockStyle(name, fn) {
  return [
    lock(),
    context(name),
    classifyLabel(name),
    fn
  ];
}

export function lockSelectable(name, fn) {
  return [
    lock('selectable'),
    context(name),
    fn
  ];
}
