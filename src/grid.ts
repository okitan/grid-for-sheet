import { sheets_v4 } from "googleapis";
import { XOR } from "ts-xor";

import { Cell } from "./cell";

export class Grid<T = unknown, C = string, R = string> {
  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  // TODO: C[]
  readonly columnItems?: string[];
  // TODO: R[]
  readonly rowItems?: string[];

  private data?: (string | number)[][];

  readonly showColumnHeader: boolean = false;
  readonly showRowHeader: boolean = false;

  readonly sumColumnHeader: boolean = false;

  constructor({
    startColumn,
    startRow,
    columnItems,
    showColumnHeader,
    sumColumnHeader,
    rowItems,
    showRowHeader,
    data,
  }: Partial<
    Pick<Grid<T, C, R>, "startColumn" | "startRow" | "sumColumnHeader">
  > & // with default
    (
      | // showColumnHeader: true requires columnItems
      { showColumnHeader: true; columnItems: Grid<T, C, R>["columnItems"] }
      | { showColumnHeader?: false; columnItems?: Grid<T, C, R>["columnItems"] }
    ) &
    (
      | // showRowHeader: true requires rowItems
      { showRowHeader: true; rowItems: Grid<T, C, R>["rowItems"] }
      | { showRowHeader?: false; rowItems?: Grid<T, C, R>["rowItems"] }
    ) &
    XOR<
      // for dynamic generation
      {},
      // for static generation
      { data: Grid["data"] }
    >) {
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;

    if (columnItems) this.columnItems = columnItems;
    if (showColumnHeader) this.showColumnHeader = showColumnHeader;

    if (sumColumnHeader) this.sumColumnHeader = sumColumnHeader;

    if (rowItems) this.rowItems = rowItems;
    if (showRowHeader) this.showRowHeader = showRowHeader;

    if (data) this.data = data;
  }

  getData(): (string | number)[][] {
    if (!this.data)
      throw new Error(
        `no data given. set data in constructor or set dataGenerator and calculate`
      );

    // deep copy
    const data: (string | number)[][] = JSON.parse(JSON.stringify(this.data));

    if (this.sumColumnHeader) {
      const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);
      const rowOffset = this.startRow + (this.showColumnHeader ? 1 : 0);

      const rowCount = this.rowItems?.length || this.data.length;

      data.unshift(
        (this.columnItems || this.data[0]).map((_, i) => {
          const cell = new Cell({
            column: columnOffset + i,
            row: rowOffset + 1,
          });

          return `=SUM(${cell.toRange({ bottom: rowCount - 1 })})`;
        })
      );
    }

    if (this.showColumnHeader) {
      if (!this.columnItems)
        throw new Error("showColumnHeader requries columnItems");

      data.unshift([...this.columnItems]);
    }

    if (this.showRowHeader) {
      if (!this.rowItems) throw new Error("showRowHeader requries rowItems");

      const rowItems = this.showColumnHeader
        ? this.sumColumnHeader
          ? ["", "計", ...this.rowItems]
          : ["", ...this.rowItems]
        : this.sumColumnHeader
        ? ["計", ...this.rowItems]
        : this.rowItems;

      data.forEach((row, i) => row.unshift(rowItems[i]));
    }

    return data;
  }

  toGridData(): sheets_v4.Schema$GridData {
    return {
      startColumn: this.startColumn,
      startRow: this.startRow,
      rowData: this.getData().map((row) => ({
        values: row.map((e) => Cell.data(e)),
      })),
    };
  }
}
