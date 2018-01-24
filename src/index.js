var jsua = window.jsua || require('@lynx-json/jsua');
import { query, map, filter, select, applyAdjustments } from '@lynx-json/jsua-style';
import filters from './filters';
import mappers from './mappers';
import * as styles from './styles';
import { lockStyle, lockSelectable } from './util';

import * as material from '@lynx-json/jsua-material';

jsua.finishing.register('jsua-styling-example', function stylesheet(result) {
  query(result.view).each([
    // Concealed/Revealed
    select('[data-lynx-visibility=concealed], [data-lynx-visibility=revealed]', [
      filter(filters.unlocked('[data-lynx-hints~=set]'), lockStyle('concealed-revealed-set', styles.expansionPanel.set())),
      filter(filters.unlocked('[data-lynx-hints~=list]'), lockStyle('concealed-revealed-list', styles.expansionPanel.list())),
      filter(filters.unlocked('[data-lynx-hints~=group]'), lockStyle('concealed-revealed-group', styles.expansionPanel.group())),
      filter(filters.unlocked('[data-lynx-hints~=complement]'), lockStyle('concealed-revealed-complement', styles.expansionPanel.complement())),
      filter(filters.unlocked(), lockStyle('concealed-revealed-default', styles.expansionPanel.container()))
    ]),

    // General Styling
    filter(filters.isApplicationRoot(), styles.body()),
    filter(filters.isPage(), lockStyle('page', [
      material.container(),
      material.padding('16px')
    ])),
    select('[data-lynx-hints~=complement]', [
      filter(filters.unlocked(), lockStyle('complement-default', styles.complement()))
    ]),
    select('[data-lynx-hints~=table]', [
      filter(filters.unlocked(), lockStyle('table-default', material.table.auto()))
    ]),
    select('[data-lynx-hints~=header]', [
      filter(filters.unlocked(filters.has(mappers.realParent('[data-lynx-hints~=table]'))), lockStyle('default-table-header', material.tableRow.auto())),
      filter(filters.unlocked('[data-lynx-hints~=banner]'), lockStyle('default-banner', styles.banner())),
      filter(filters.unlocked(), lockStyle('header-default', material.header()))
    ]),
    select('[data-lynx-hints~=footer]', [
      filter(filters.unlocked(), lockStyle('footer-default', material.footer()))
    ]),
    select('[data-lynx-hints~=set]', [
      filter(filters.unlocked(), lockStyle('set-default', material.set.auto()))
    ]),
    select('[data-lynx-hints~=list]', [
      filter(filters.unlocked(), lockStyle('list-default', material.list()))
    ]),
    select('[data-lynx-hints~=group]', [
      filter(filters.unlocked(filters.has(mappers.realParent('[data-lynx-hints~=table]'))), lockStyle('default-table-row', material.tableRow.auto())),
      filter(filters.unlocked(), lockStyle('group-default', material.group()))
    ]),
    select('[data-lynx-hints~=card]', [
      filter(filters.unlocked(), lockStyle('card-default', material.card()))
    ]),
    select('[data-lynx-hints~=container], [data-lynx-hints~=form]', [
      filter(filters.unlocked(), lockStyle('container-default', material.container()))
    ]),
    select('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [
      filter(filters.unlocked(), lockStyle('control-default', material.group({ alignItems: 'center', gap: '8px'})))
    ]),
    select('[data-lynx-hints~=label]', [
      filter(filters.unlocked(), lockStyle('label-default', material.text.subheading()))
    ]),
    select('[data-lynx-hints~=image]', [
      filter(filters.unlocked(), lockStyle('image-default', styles.image()))
    ]),

    // Selectables
    select('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [
      filter(filters.unlocked('selectable', '*'), lockSelectable('selectable-default', styles.selectable.highlightLabel()))
    ]),

    applyAdjustments
  ])
});
