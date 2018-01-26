var jsua = window.jsua || require('@lynx-json/jsua');
import { query, map, filter, select, applyAdjustments } from '@lynx-json/jsua-style';
import filters from './filters';
import mappers from './mappers';
import * as styles from './styles';
import { lockStyle, lockSelectable, labelFor } from './util';

import * as material from '@lynx-json/jsua-material';

jsua.finishing.register('jsua-styling-example', function stylesheet(result) {
  query(result.view).each([
    select(filters.unlocked('[data-lynx-hints~=banner]'), lockStyle('banner', styles.banner())),

    select('[data-lynx-visibility=concealed], [data-lynx-visibility=revealed]', [
      filter(filters.unlocked('[data-lynx-hints~=set]'), lockStyle('concealed-revealed-set', styles.expansionPanel.set())),
      filter(filters.unlocked('[data-lynx-hints~=list]'), lockStyle('concealed-revealed-list', styles.expansionPanel.list())),
      filter(filters.unlocked('[data-lynx-hints~=group]'), lockStyle('concealed-revealed-group', styles.expansionPanel.group())),
      filter(filters.unlocked('[data-lynx-hints~=complement]'), lockStyle('concealed-revealed-complement', styles.expansionPanel.complement())),
      filter(filters.unlocked(), lockStyle('concealed-revealed', styles.expansionPanel.container()))
    ]),

    // General Styling
    filter(filters.isApplicationRoot(), styles.body()),
    filter(filters.isPage(), lockStyle('page', styles.page())),
    select('[data-lynx-hints~=complement]', [
      filter(filters.unlocked(), lockStyle('complement', styles.complement()))
    ]),
    select('[data-lynx-hints~=table]', [
      filter(filters.unlocked(), lockStyle('table', styles.table()))
    ]),
    select('[data-lynx-hints~=header]', [
      filter(filters.unlocked(filters.has(mappers.realParent('[data-lynx-hints~=table]'))), lockStyle('default-table-header', material.tableRow.auto())),
      filter(filters.unlocked(), lockStyle('header', material.header()))
    ]),
    select('[data-lynx-hints~=footer]', [
      filter(filters.unlocked(), lockStyle('footer', material.footer()))
    ]),
    select('[data-lynx-hints~=set]', [
      filter(filters.unlocked(), lockStyle('set', material.set.auto()))
    ]),
    select('[data-lynx-hints~=list]', [
      filter(filters.unlocked(), lockStyle('list', material.list()))
    ]),
    select('[data-lynx-hints~=group]', [
      filter(filters.unlocked(filters.has(mappers.realParent('[data-lynx-hints~=table]'))), lockStyle('default-table-row', material.tableRow.auto())),
      filter(filters.unlocked(), lockStyle('group', material.group()))
    ]),
    select('[data-lynx-hints~=card]', [
      filter(filters.unlocked(), lockStyle('card', material.card({ footerMapper: mappers.last(mappers.footers())})))
    ]),
    select('[data-lynx-hints~=container], [data-lynx-hints~=form]', [
      filter(filters.unlocked(), lockStyle('container', material.container()))
    ]),
    select('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [
      filter(filters.unlocked(), lockStyle('control', material.group({ alignItems: 'center', gap: '8px'})))
    ]),
    select('[data-lynx-hints~=text][data-lynx-input]', [
      filter(filters.unlocked(), lockStyle('text-input', styles.textInput()))
    ]),
    select('[data-lynx-hints~=label]', [
      filter(filters.unlocked(filters.isLabelFor('page')), lockStyle('label-page', material.text.headline())),
      filter(filters.unlocked(filters.isLabelFor('text-input')), lockStyle('label-text-input', material.text.caption())),
      filter(filters.unlocked(), lockStyle('label', material.text.subheading()))
    ]),
    select('[data-lynx-hints~=image]', [
      filter(filters.unlocked(), lockStyle('image', styles.image()))
    ]),

    // Selectables
    select('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [
      filter(filters.unlocked('selectable', filters.isInContext('banner')), lockSelectable('selectable-in-banner', styles.selectable.inBanner())),
      filter(filters.unlocked('selectable', filters.isInContext('footer')), lockSelectable('selectable-in-footer', material.flatButton({ color: 'Blue', labelMapper: mappers.label()}))),
      filter(filters.unlocked('selectable', '*'), lockSelectable('selectable', styles.selectable.highlightLabel()))
    ]),

    applyAdjustments
  ])
});
