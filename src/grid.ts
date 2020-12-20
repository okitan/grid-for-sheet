import { sheets_v4 } from "googleapis";
import { XOR } from "ts-xor";

import { Cell } from "./cell";

export class Grid<T = unknown, C = string, R = string> {
  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  private data?: (string | number)[][];

  // TODO: C[]
  readonly columnItems?: string[];
  // TODO: R[]
  readonly rowItems?: string[];

  readonly showColumnHeader: boolean = false;
  readonly showRowHeader: boolean = false;

  readonly sumHeaderRow: boolean = false;
  readonly sumColumn: boolean = false;

  // dynamic
  readonly dataGenerator?: (
    args: T,
    column: string,
    columnIndex: number,
    row: string,
    rowIndex: number
  ) => string | number;

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
    dataGenerator,
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
      { dataGenerator: Grid<T, C, R>["dataGenerator"] },
      // for static generation
      { data: Grid<T, C, R>["data"] }
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

    if (dataGenerator) this.dataGenerator = dataGenerator;
  }

  generate(args: T): Grid<T, C, R>["data"] {
    const dataGenerator = this.dataGenerator;
    if (!dataGenerator) throw new Error(`no dataGenerator set`);

    const columnItems = this.columnItems || [""];
    const rowItems = this.rowItems || [""];

    return (this.data = rowItems.map((row, rowIndex) =>
      columnItems.map((column, columnIndex) => dataGenerator(args, column, columnIndex, row, rowIndex))
    ));
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
    const columnLength = this.columnItems?.length || (this.data ? this.data[0].length : 1);
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [...Array(columnLength).keys()].map((i) => {
      const from = new Cell({ column: columnOffset + i, row: this.startRow + (this.showColumnHeader ? 1 : 0) + 1 });
      const to = new Cell({ column: columnOffset + i, row: this.startRow + this.getRowItems().length - 1 });

      return `=SUM(${from.toRange(to)})`;
    });
  }

  private getSumColumn(): string[] {
    const rowLength = this.rowItems?.length || (this.data ? this.data.length : 1);
    const rowOffset = this.startRow + (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0);
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [
      this.showColumnHeader ? "" : undefined,
      this.sumHeaderRow ? "" : undefined,
      ...[...Array(rowLength).keys()].map((i) => {
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
