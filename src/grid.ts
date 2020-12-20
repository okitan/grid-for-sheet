import { sheets_v4 } from "googleapis";
import { XOR } from "ts-xor";

import { Cell } from "./cell";

export class Grid<T = unknown, C = string, R = string> {
  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  private data?: (string | number)[][];

  readonly columnItems?: (C | string)[];
  readonly columnConverter?: (column: C | string, columnIndex: number) => string | number;

  // TODO: R[]
  readonly rowItems?: (R | string)[];
  readonly rowConverter?: (row: R | string, columnIndex: number) => string | number;

  readonly showColumnHeader: boolean = false;
  readonly showRowHeader: boolean = false;

  readonly sumHeaderRow: boolean = false;
  readonly sumColumn: boolean = false;

  // dynamic
  readonly dataGenerator?: (
    args: T,
    column: C | string,
    columnIndex: number,
    row: R | string,
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

      const converter = this.columnConverter;
      const columnItems = converter ? this.columnItems.map(converter) : (this.columnItems as (string | number)[]); // XXX:

      data.unshift([...columnItems]);
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

  get columnLength(): number {
    return (this.showRowHeader ? 1 : 0) + this.dataColumnLength + (this.sumColumn ? 1 : 0);
  }

  private get dataColumnLength(): number {
    return this.columnItems?.length || (this.data ? this.data[0].length : 1);
  }

  get rowLength(): number {
    return (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0) + this.dataRowLength;
  }

  private get dataRowLength(): number {
    return this.rowItems?.length || (this.data ? this.data.length : 1);
  }

  private getRowItems(): (string | number)[] {
    const rowItems: (string | number)[] = [];

    if (this.showColumnHeader) rowItems.push("");
    if (this.sumHeaderRow) rowItems.push("計");

    const converter = this.rowConverter;
    rowItems.push(
      ...(this.rowItems
        ? converter
          ? this.rowItems.map(converter)
          : (this.rowItems as (string | number)[]) // XXX:
        : Array(this.dataRowLength).fill(""))
    );

    return rowItems;
  }

  private getSumHeaderRow(): string[] {
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [...Array(this.dataColumnLength).keys()].map((i) => {
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
      ...[...Array(this.dataRowLength).keys()].map((i) => {
        const from = new Cell({ column: columnOffset, row: rowOffset + i });
        const to = new Cell({ column: this.startRow + this.columnLength - 2, row: rowOffset + i });

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
