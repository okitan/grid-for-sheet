import { sheets_v4 } from "googleapis";
import { XOR } from "ts-xor";

import { Cell } from "./cell";

export class Grid<T = unknown, C = string, R = string> {
  public readonly startColumn: number = 0;
  public readonly startRow: number = 0;

  // TODO: C[]
  public readonly columnItems?: string[];
  // TODO: R[]
  public readonly rowItems?: string[];

  private data?: (string | number)[][];

  private readonly showColumnHeader: boolean = false;
  private readonly showRowHeader: boolean = false;

  constructor({
    startColumn,
    startRow,
    columnItems,
    showColumnHeader,
    rowItems,
    showRowHeader,
    data,
  }: Partial<Pick<Grid<T, C, R>, "startColumn" | "startRow">> & // with default
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

    if (this.showColumnHeader) {
      if (!this.columnItems)
        throw new Error("showColumnHeader requries columnItems");
      data.unshift([...this.columnItems]);
    }

    if (this.showRowHeader) {
      if (!this.rowItems) throw new Error("showRowHeader requries rowItems");

      const rowItems = this.showColumnHeader
        ? ["", ...this.rowItems]
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
