# @okitan/grid-for-sheet

utilities for google spreadsheet griddata generation

## Installation

```
$ npm install @okitan/grid-for-sheet
```

## Usage

```typescript
import { Grid } from "@okitan/grid-for-sheet";

const grid = new Grid({ data: [["strong", 0]] });

grid.toGridData();
/* returns
{
  rowData: [
    { values: [
      {
        userEnteredValue: { stringValue: "strong" }
      },
      {
        userEnteredValue: { numberValue: 0 }
      }
    ]}
  ]
}
 */
```

More usage: `tests/grid.test.ts`.

## Terminology

```
     A     B     C     D
1 |     | C1  | C2  |     | ← columnHeader
2 |     | SUM | SUM | SOS | ← columnTotalHeader
3 | R1  |     |     | SUM |
4 | R2  |     |     | SUM |
    ↑ rowHeader        ↑ rowTotal
```

- columnHeader
  - activated by column.showHeader
- columnTotalHeader
  - activated by sum.column
- rowHeader
  - activated by row.showHeader
- rowTotal
  - activated by sum.row
