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
