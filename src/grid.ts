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

  readonly sumHeaderRow: boolean = false;
  readonly sumColumn: boolean = false;

  constructor({
    startColumn,
    startRow,
    columnItems,
    showColumnHeader,
    sumHeaderRow,
    rowItems,
    showRowHeader,
    sumColumn,
    data,
  }: Partial<Pick<Grid<T, C, R>, "startColumn" | "startRow" | "sumHeaderRow" | "sumColumn">> & // with default
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

    if (sumHeaderRow) this.sumHeaderRow = sumHeaderRow;

    if (rowItems) this.rowItems = rowItems;
    if (showRowHeader) this.showRowHeader = showRowHeader;
    if (sumColumn) this.sumColumn = sumColumn;

    if (data) this.data = data;
  }

  getData(): (string | number)[][] {
    if (!this.data) throw new Error(`no data given. set data in constructor or set dataGenerator and calculate`);

    // deep copy
    const data: (string | number)[][] = JSON.parse(JSON.stringify(this.data));

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.sumHeaderRow) data.unshift(this.getSumHeaderRow());

    if (this.showColumnHeader) {
      if (!this.columnItems) throw new Error("showColumnHeader requries columnItems");

      data.unshift([...this.columnItems]);
    }

    // rows last
    // column header are added here
    if (this.showRowHeader) {
      if (!this.rowItems) throw new Error("showRowHeader requries rowItems");

      data.forEach((row, i) => row.unshift(this.getRowItems()[i]));
    }

    if (this.sumColumn) {
      data.forEach((row, i) => row.push(this.getSumColumn()[i]));
    }

    return data;
  }

  private getRowItems(): string[] {
    const rowItems = this.rowItems ? this.rowItems : this.data ? this.data.map(() => "") : [""];

    return [this.showColumnHeader ? "" : undefined, this.sumHeaderRow ? "計" : undefined, ...rowItems].filter(
      (e): e is string => typeof e !== "undefined"
    );
  }

  private getColumnItems(): string[] {
    const columnItems = this.columnItems ? this.columnItems : this.data ? this.data[0].map(() => "") : [""];

    return [this.showRowHeader ? "" : undefined, ...columnItems, this.sumColumn ? "" : undefined].filter(
      (e): e is string => typeof e !== "undefined"
    );
  }

  private getSumHeaderRow(): string[] {
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return (this.columnItems || (this.data ? this.data[0] : [""])).map((_, i) => {
      const from = new Cell({ column: columnOffset + i, row: this.startRow + (this.showColumnHeader ? 1 : 0) + 1 });
      const to = new Cell({ column: columnOffset + i, row: this.startRow + this.getRowItems().length - 1 });

      return `=SUM(${from.toRange(to)})`;
    });
  }

  private getSumColumn(): string[] {
    const rowOffset = this.startRow + (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0);
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [
      this.showColumnHeader ? "" : undefined,
      this.sumHeaderRow ? "" : undefined,
      ...(this.rowItems || (this.data ? this.data.map((e) => e[0]) : [""])).map((_, i) => {
        const from = new Cell({ column: columnOffset, row: rowOffset + i });
        const to = new Cell({ column: this.startRow + this.getColumnItems().length - 2, row: rowOffset + i });

        return `=SUM(${from.toRange(to)})`;
      }),
    ].filter((e): e is string => typeof e !== "undefined");
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
