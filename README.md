Styling Example
=================================================

This project provides a starting point and guidance for styling a JSUA
application. The techniques described here should translate well into styling
on other, similar, platforms (IOSUA, for example).

Goals
-------------------------------------------------

- Easily locate the source of styling.
- Easily style one element at a time.
- Handle concepts like selectability and visibility consistently and easily.
- Dramatically reduce necessary configuration code.
- Reduce need for presentation-specific elements.
- Eliminate presentation-specific wrappers that replace their children in the semantic
  hierarchy.
- Create a styling language that can be readily ported to other platforms.

- Styling: Grouped by hint/input as current. But more consistent. Styling is done no other way.
- Visibility: Consistent because we use a consistent layout view that doesn't need to hidden/visible
- Positioning: Experiment as needed and identify common patterns.
- Selectability: As current, but more consistent. Never handle selectability anywhere else.
- Any other state changes would be handled within a styling component. No need for consistency.

```js

// 1. normal styling
// 2. Visibility
// 3. Selectability
// 4. Positioning?

```

```js
// Common layout
el => el.style.display = 'flex',
map(mappers.createLayoutView(), [
  el => el.style.display = 'grid'
]),
when('normal', el => el.style.display = 'flex'),
when('visibility', 'hidden', el => el.style.display = 'none'),
setState('normal')
```

> Lingering questions. How to deal with positioning (align/justify) consistently.

Layout
-------------------------------------------------

Almost all elements are aligned in a grid. With CSS, the grid is implemented
with `display: grid`, but the most important elements of a grid layout can be
recreated easily on other platforms. The benefits of this consistency are that
individual elements can easily control their own alignment and justification
without concern for context. This reduces coupling between styling functions
and makes styling configuration far more manageable.

Consider the following style:

```js
select('[data-lynx-hints~="http://example.com/money"]', [
  justifySelf("end")
])
```

It doesn't matter whether the `money` value is part of a list, group, form, or link. Since all of these containers provide a common grid layout, we know that it will be justified to the right (when the reading order is left-to-right).

Visibility
-------------------------------------------------

Another benefit of the common grid layout is that *all* elements can handle `hidden` visibility consistently. The following style handles visibility for all semantic elements.

```js
select('[data-lynx-hints]', [
  when('visibility', 'hidden', el => el.style.display = 'none'),
  when('visibility', 'visible', el => el.style.display = 'grid')
])
```

Color and Font
-------------------------------------------------

Color and font characteristics are established from the outside in. For example, the `page` establishes a background color, font color, and default font style. The `banner` overrides some or all of these characteristics. In general, color and font settings
should *only* be specified if necessary to override inherited settings.

```js
select("[data-jsua-context~=page]", [
  background.main(),
  color(),
  text.body()
]),
select("[data-lynx-hints~=banner]", [
  background({ color: primaryColor }),
  color({ color: getContrastingColor(primaryColor)})
])
```

Selection
-------------------------------------------------

Selection should be handled for all selectable elements as a single block,
configured from most specific to least specific, and locking as decisions are made.

Guidance
-------------------------------------------------

### Do

- Configure styling from more specific to less specific, locking elements as they are styled.
- Group styling functions by base hint.
