import * as material from '@lynx-json/jsua-material';
import * as colors from '../colors';
import { on, when, map, setState, clearState } from '@lynx-json/jsua-style';
import mappers from '../mappers';

export function highlightLabel(options = {}) {
  return [
    el => el.style.outline = 'none',
    el => el.style.cursor = 'pointer',
    when('normal', [
      map(mappers.label(), [
        el => el.style.fontWeight = 'normal',
        el => el.style.color = 'inherit',
        el => el.style.textDecoration = 'none',
      ])
    ]),
    when('selectable', [
      map(mappers.label(), [
        el => el.style.fontWeight = 'normal',
        material.color({ color: colors.primary, shade: '700' })
      ])
    ]),
    when('hover', function (el) {
      if (el.jsuaStyleHasState('selectable')) {
        map(mappers.label(), [
          material.color({ color: colors.primary, shade: '900' }),
          el => el.style.textDecoration = 'underline'
        ])(el);
      }
    }),
    when('active', function (el) {
      if (el.jsuaStyleHasState('selectable')) {
        map(mappers.label(), [
          material.color({ color: colors.primary, shade: '900' }),
          el => el.style.textDecoration = 'underline'
        ])(el);
      }
    }),
    when('selected', map(mappers.label(), [
      el => el.style.color = 'inherit',
      el => el.style.fontWeight = 'bold'
    ])),
    on('mouseover', setState('hover')),
    on('mouseout', clearState('hover')),
    on('mousedown', setState('active')),
    on('mouseup', clearState('active')),
    setState('normal')
  ];
}

export function inBanner(options = {}) {
  return material.flatButton({ backgroundColor: colors.primary });
}
