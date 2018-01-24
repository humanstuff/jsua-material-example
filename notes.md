- Principle. Each style block can style itself and specify default values for
  children. But beyond that, each child must handle its own stuff.
  - align-items -> align-self
  - justify-items -> justify-self
  - grid-gap -> pull-to-edges?
  - padding() -> find all pull-to-edges and use negative margins to offset padding
  - standing-line/span-all -> flex-basis 100%, grid-column: 1 / -1

Consider always adding a layout-container or something like that, the benefit
would be that 1) you can style anything and then apply expansion panel or selectable,
and 2) you can always apply the same visibility state code.
