import { map, adjust, filter, setState } from '@lynx-json/jsua-style';
import mappers from '../mappers';
import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';

function concealedExpansionPanel() {
  return [
    map(mappers.children('[data-lynx-visibility-conceal]'), el => el.parentElement.removeChild(el)),
    material.expansionPanel({ headerMapper: mappers.first(mappers.headers()) }),
    adjust(filter('[data-lynx-visibility=revealed]', setState('open')))
  ];
}

export function complement() {
  return [
    concealedExpansionPanel(),
    el => material.background.accent({ backgroundColor: colors.secondary, shade: 'A100' })(el),
    material.color({ color: 'Black', opacity: 0.54 }),
    material.container()
  ];
}

export function set() {
  return [
    concealedExpansionPanel(),
    material.set()
  ];
}

export function group() {
  return [
    concealedExpansionPanel(),
    material.group()
  ];
}

export function list() {
  return [
    concealedExpansionPanel(),
    material.list()
  ];
}

export function container() {
  return [
    concealedExpansionPanel(),
    material.container()
  ];
}
