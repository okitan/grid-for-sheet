import { sheets_v4 } from "googleapis";
import { XOR } from "ts-xor";

import { Cell } from "./cell";

export class Grid<T = {}, C = string, R = string> {
  readonly sheet?: string;

  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  private data?: (string | number)[][];

  readonly columnItems?: C[];
  readonly columnConverter?: (column: C, columnIndex: number) => string | number;
  readonly columnPixelSize?: number;

  readonly rowItems?: R[];
  readonly rowConverter?: (row: R, columnIndex: number) => string | number;

  readonly showColumnHeader: boolean = false;
  readonly columnHeaderFormat?:
    | sheets_v4.Schema$CellFormat
    | sheets_v4.Schema$CellFormat[]
    | ((column: C | undefined, columnIndex: number) => sheets_v4.Schema$CellFormat | undefined);

  readonly showRowHeader: boolean = false;
  readonly rowHeaderFormat?:
    | sheets_v4.Schema$CellFormat
    | sheets_v4.Schema$CellFormat[]
    | ((row: R | undefined, rowIndex: number) => sheets_v4.Schema$CellFormat | undefined);
  readonly rowHeaderPixelSize?: number;

  readonly sumHeaderRow: boolean = false;
  readonly sumHeaderRowPixelSize?: number;
  readonly sumColumn: boolean = false;

  // dynamic
  readonly dataGenerator?: (
    column: C | undefined,
    columnIndex: number,
    row: R | undefined,
    rowIndex: number,
    args: T
  ) => string | number;

  constructor({
    sheet,
    startColumn,
    startRow,
    column,
    row,
    dataGenerator,
    data,
  }: Partial<Pick<Grid<T, C, R>, "sheet" | "startColumn" | "startRow" | "sumColumn" | "rowConverter">> & {
    column?: { pixelSize?: number; sum?: boolean; sumPixelSize?: number } & (
      | {
          showHeader: true;
          items: Grid<T, C, R>["columnItems"];
          converter?: Grid<T, C, R>["columnConverter"];
          headerFormat?: Grid<T, C, R>["columnHeaderFormat"];
        }
      | {
          showHeader?: false;
          items?: Grid<T, C, R>["columnItems"];
        }
    );
    row?: { sum?: boolean } & (
      | {
          showHeader: true;
          items: Grid<T, C, R>["rowItems"];
          converter?: Grid<T, C, R>["rowConverter"];
          headerFormat?: Grid<T, C, R>["rowHeaderFormat"];
          headerPixelSize?: number;
        }
      | {
          showHeader?: false;
          items?: Grid<T, C, R>["rowItems"];
        }
    );
  } & XOR<
      // for dynamic generation
      { dataGenerator: Grid<T, C, R>["dataGenerator"] },
      // for static generation
      { data: Grid<T, C, R>["data"] }
    >) {
    if (sheet) this.sheet = sheet;
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;

    if (column) {
      if (column.items) this.columnItems = column.items;
      if (column.showHeader) this.showColumnHeader = column.showHeader;
      if ("converter" in column) this.columnConverter = column.converter;
      if ("headerFormat" in column) this.columnHeaderFormat = column.headerFormat;

      // column.sum is the sum of column, and we should add them as row
      if (column.sum) this.sumHeaderRow = column.sum;
      if (column.sumPixelSize) this.sumHeaderRowPixelSize = column.sumPixelSize;

      if (column.pixelSize) this.columnPixelSize = column.pixelSize;
    }

    if (row) {
      if (row.items) this.rowItems = row.items;
      if (row.showHeader) this.showRowHeader = row.showHeader;
      if ("converter" in row) this.rowConverter = row.converter;
      if ("headerFormat" in row) this.rowHeaderFormat = row.headerFormat;

      // row.sum is the sum of row, and we should add them as column
      if (row.sum) this.sumColumn = row.sum;

      if ("headerPixelSize" in row) this.rowHeaderPixelSize = row.headerPixelSize;
    }

    if (dataGenerator) this.dataGenerator = dataGenerator;
    if (data) this.data = data;
  }

  /*
    data
   */
  generate(args: T): Grid<T, C, R>["data"] {
    const dataGenerator = this.dataGenerator;
    if (!dataGenerator) throw new Error(`no dataGenerator set`);

    const columnItems = this.columnItems || [...Array<C>(1)];
    const rowItems = this.rowItems || [...Array<R>(1)];

    return (this.data = rowItems.map((row, rowIndex) =>
      columnItems.map((column, columnIndex) => dataGenerator(column, columnIndex, row, rowIndex, args))
    ));
  }

  getData(): (string | number)[][] {
    if (!this.data) throw new Error(`no data given. set data in constructor or set dataGenerator and calculate`);

    // deep copy
    const data: (string | number)[][] = JSON.parse(JSON.stringify(this.data));

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.sumHeaderRow) data.unshift(this.sumHeaderRowData);

    if (this.showColumnHeader) {
      if (!this.columnItems) throw new Error("showColumnHeader requries columnItems");

      const converter = this.columnConverter;
      // @ts-ignore for most case this.columnItems are string[]
      const columnItems: (string | number)[] = converter ? this.columnItems.map(converter) : this.columnItems;

      data.unshift([...columnItems]);
    }

    // rows last
    // column header are added here
    if (this.showRowHeader) {
      if (!this.rowItems) throw new Error("showRowHeader requries rowItems");

      data.forEach((row, i) => row.unshift(this.rowItemsData[i]));
    }

    if (this.sumColumn) {
      data.forEach((row, i) => row.push(this.sumColumnData[i]));
    }

    return data;
  }

  private get rowItemsData(): (string | number)[] {
    const rowItems: (string | number)[] = [];

    if (this.showColumnHeader) rowItems.push("");
    if (this.sumHeaderRow) rowItems.push("計");

    const converter = this.rowConverter;
    rowItems.push(
      ...(this.rowItems
        ? converter
          ? this.rowItems.map(converter)
          : this.rowItems // XXX
        : Array(this.dataRowLength).fill(""))
    );

    return rowItems;
  }

  // this does not consider showRowHeader and sumColumn
  private get sumHeaderRowData(): string[] {
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [...Array(this.dataColumnLength).keys()].map((i) => {
      const from = new Cell({ column: columnOffset + i, row: this.startRow + (this.showColumnHeader ? 1 : 0) + 1 });
      const to = new Cell({ column: columnOffset + i, row: this.startRow + this.rowItemsData.length - 1 });

      return `=SUM(${from.toRange(to)})`;
    });
  }

  private get sumColumnData(): string[] {
    const sumColumn: string[] = [];

    const rowOffset = this.startRow + (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0);
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    if (this.showColumnHeader) sumColumn.push("");
    if (this.sumHeaderRow) sumColumn.push("");

    sumColumn.push(
      ...[...Array(this.dataRowLength).keys()].map((i) => {
        const from = new Cell({ column: columnOffset, row: rowOffset + i });
        const to = new Cell({ column: this.startRow + this.columnLength - 2, row: rowOffset + i });

        return `=SUM(${from.toRange(to)})`;
      })
    );

    return sumColumn;
  }

  private get metadata(): (sheets_v4.Schema$CellFormat | undefined)[][] {
    const data: (sheets_v4.Schema$CellFormat | undefined)[][] = [...Array(this.dataRowLength)].map((_) => [
      ...Array(this.dataColumnLength),
    ]);

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.sumHeaderRow) {
      data.unshift([...Array(this.dataColumnLength)]);
    }

    if (this.showColumnHeader) {
      const columnHeaderFormat = this.columnHeaderFormat;

      if (!columnHeaderFormat) {
        data.unshift([...Array(this.dataColumnLength)]);
      } else {
        switch (typeof columnHeaderFormat) {
          case "object":
            data.unshift(
              [...Array(this.dataColumnLength)].map((_, i) =>
                Array.isArray(columnHeaderFormat) ? columnHeaderFormat[i] : columnHeaderFormat
              )
            );
            break;
          case "function":
            if (!this.columnItems) throw "never";
            data.unshift(this.columnItems.map(columnHeaderFormat));
            break;
          default:
            const never: never = columnHeaderFormat;
            throw never;
        }
      }
    }

    // rows last
    // column header are added here
    if (this.showRowHeader) {
      const rowHeaderFormat = this.rowHeaderFormat;

      if (!rowHeaderFormat) {
        data.forEach((row) => row.unshift(undefined));
      } else {
        switch (typeof rowHeaderFormat) {
          case "object":
            data.forEach((row, i) => {
              const index = i - (this.showColumnHeader ? 1 : 0) - (this.sumHeaderRow ? 1 : 0);

              row.unshift(
                index >= 0 ? (Array.isArray(rowHeaderFormat) ? rowHeaderFormat[index] : rowHeaderFormat) : undefined
              );
            });
            break;
          case "function":
            data.forEach((row, i) => {
              const index = i - (this.showColumnHeader ? 1 : 0) - (this.sumHeaderRow ? 1 : 0);

              row.unshift(index >= 0 ? rowHeaderFormat(this.rowItems && this.rowItems[index], index) : undefined);
            });

            break;
          default:
            const never: never = rowHeaderFormat;
            throw never;
        }
      }
    }

    if (this.sumColumn) {
      // TODO:
      data.forEach((row) => row.push(undefined));
    }

    return data;
  }

  /*
    metrics
   */
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

  /*
    google spreadsheet griddata convertion
   */
  toGridData(args?: T): sheets_v4.Schema$GridData {
    if (args) this.generate(args);

    const metadata = this.metadata;

    const data: sheets_v4.Schema$GridData = {
      startColumn: this.startColumn,
      startRow: this.startRow,
      rowData: this.getData().map((row, i) => {
        return {
          values: row.map((e, j) => {
            const datum = Cell.data(e);
            const metadatum = metadata[i][j];

            return metadatum ? { ...datum, userEnteredFormat: metadatum } : datum;
          }),
        };
      }),
    };

    // columnMetadata
    if (this.rowHeaderPixelSize || this.columnPixelSize || this.sumHeaderRowPixelSize) {
      data.columnMetadata = [];

      if (this.showRowHeader)
        data.columnMetadata.push(this.rowHeaderPixelSize ? { pixelSize: this.rowHeaderPixelSize } : {});

      data.columnMetadata.push(
        ...Array(this.dataColumnLength).fill(this.columnPixelSize ? { pixelSize: this.columnPixelSize } : {})
      );

      if (this.sumColumn)
        data.columnMetadata.push(this.sumHeaderRowPixelSize ? { pixelSize: this.sumHeaderRowPixelSize } : {});
    }

    return data;
  }

  /*
    pointer for particular cell
   */
  get origin(): Cell {
    return new Cell({ sheet: this.sheet, column: this.startColumn, row: this.startRow });
  }

  get dataOrigin(): Cell {
    return this.origin.relative({
      right: this.columnLength - this.dataColumnLength,
      bottom: this.rowLength - this.dataRowLength,
    });
  }

  toRange(): string {
    return this.origin.toRange({ right: this.columnLength - 1, bottom: this.rowLength - 1 });
  }
}
