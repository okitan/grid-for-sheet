## 2.3.0 - 20201-01-23

### Added

- `sum.row.labelFormat` to decorize rowTotalLabel

## 2.2.0 - 2021-01-02

### Added

- to pass grid to generator

### Fixed

- allow data to have undefined

## 2.1.0 - 2021-01-01

### Added

- toRange accept option of `{ local: true }` for in sheet reference
- allow undefined for data

## 2.0.0 - 2020-12-31

### Added

- add `data.format` to format data cell
- `createRightGrid` and `createLowerGrid` to create relative grid considering grid size
- labels

### Changed

- constructor params are drastically changed
- remove `sumOfSum` option. When both `sum.row` and `sum.column` is assigned, it alwasys show sum of sum

## 1.4.0 - 2020-12-30

### Changed

- `sumColumnOrigin` returns sumColumn's origin (it formerly returns sumHeaderRow's origin)
- added `sumHeaderRowOrigin` returns sumHeaderRow's origin

## 1.3.0 - 2020-12-29

### Added

- sum of sum

### Fixed

- fix sum row range caluculation, in case `startRow` and `startColumn` is different

## 1.2.0 - 2020-12-28

### Added

- finder for particular cell

## 1.1.0 - 2020-12-27

### Added

- row header formatter

### Fixed

- column metadata bugs

## 1.0.0 - 2020-12-26

- initial release
