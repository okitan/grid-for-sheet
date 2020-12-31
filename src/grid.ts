import { sheets_v4 } from "googleapis";

import { Cell } from "./cell";

export type GridConstructor<T, C, R> = {
  sheet?: string;
  startColumn?: number;
  startRow?: number;
  column?: { pixelSize?: number } & (
    | ({
        showHeader: true;
        items: Grid<T, C, R>["_columnItems"];
        headerFormat?: Grid<T, C, R>["columnHeaderFormat"];
      } & (Exclude<C, string | number> extends never
        ? { converter?: Grid<T, C, R>["columnConverter"] }
        : { converter: Grid<T, C, R>["columnConverter"] }))
    | {
        showHeader?: false;
        items?: Grid<T, C, R>["_columnItems"];
      }
  );
  row?:
    | ({
        showHeader: true;
        items: Grid<T, C, R>["_rowItems"];
        headerFormat?: Grid<T, C, R>["rowHeaderFormat"];
        headerPixelSize?: number;
      } & (Exclude<R, string | number> extends never
        ? { converter?: Grid<T, C, R>["rowConverter"] }
        : { converter: Grid<T, C, R>["rowConverter"] }))
    | {
        showHeader?: false;
        items?: Grid<T, C, R>["_rowItems"];
      };
  sum?: {
    row?: {
      label?: string; // only shown when headerRow is present
      pixelSize?: number;
    };
  } & (
    | {
        total?: true;
        column: {
          label?: string; // only shown when headerColumn is present
          pixelSize?: number;
        };
      }
    | {
        total?: false;
        column?: {
          label?: string;
          pixelSize: number;
        };
      }
  );
  data: { format?: Grid<T, C, R>["dataFormat"] } & (
    | {
        values: (string | number)[][];
      }
    | {
        generator: Grid<T, C, R>["dataGenerator"];
      }
  );
};

export class Grid<T = {}, C = string, R = string> {
  readonly sheet?: string;

  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  private _data?: (string | number)[][];
  readonly dataFormat?:
    | sheets_v4.Schema$CellFormat
    | sheets_v4.Schema$CellFormat[][]
    | ((column: C, columnIndex: number, row: R, rowIndex: number) => sheets_v4.Schema$CellFormat | undefined);

  private readonly _columnItems?: C[];
  readonly columnConverter?: (column: C, columnIndex: number) => string | number;
  readonly columnPixelSize?: number;

  private readonly _rowItems?: R[];
  readonly rowConverter?: (row: R, columnIndex: number) => string | number;

  readonly showColumnHeader: boolean = false;
  readonly columnHeaderFormat?:
    | sheets_v4.Schema$CellFormat
    | sheets_v4.Schema$CellFormat[]
    | ((column: C, columnIndex: number) => sheets_v4.Schema$CellFormat | undefined);

  readonly showRowHeader: boolean = false;
  readonly rowHeaderFormat?:
    | sheets_v4.Schema$CellFormat
    | sheets_v4.Schema$CellFormat[]
    | ((row: R, rowIndex: number) => sheets_v4.Schema$CellFormat | undefined);
  readonly rowHeaderPixelSize?: number;

  readonly sumHeaderRow: boolean = false;
  readonly sumHeaderRowPixelSize?: number;
  readonly sumOfSum: boolean = false;

  readonly sumColumn: boolean = false;

  // dynamic
  readonly dataGenerator?: (column: C, columnIndex: number, row: R, rowIndex: number, args: T) => string | number;

  constructor({ sheet, startColumn, startRow, column, row, sum, data }: GridConstructor<T, C, R>) {
    if (sheet) this.sheet = sheet;
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;

    if (column) {
      if (column.items) this._columnItems = column.items;
      if (column.showHeader) this.showColumnHeader = column.showHeader;
      if ("converter" in column) this.columnConverter = column.converter;
      if ("headerFormat" in column) this.columnHeaderFormat = column.headerFormat;

      if (column.pixelSize) this.columnPixelSize = column.pixelSize;
    }

    if (row) {
      if (row.items) this._rowItems = row.items;
      if (row.showHeader) this.showRowHeader = row.showHeader;
      if ("converter" in row) this.rowConverter = row.converter;
      if ("headerFormat" in row) this.rowHeaderFormat = row.headerFormat;

      if ("headerPixelSize" in row) this.rowHeaderPixelSize = row.headerPixelSize;
    }

    if (sum) {
      if (sum.column) {
        // column.sum is the sum of column, and we should add them as row
        this.sumHeaderRow = true;
        if (sum.column.pixelSize) this.sumHeaderRowPixelSize = sum.column.pixelSize;
        // if (sum.column.label) // TODO:
      }
      if (sum.row) {
        // row.sum is the sum of row, and we should add them as column
        this.sumColumn = true;
        // if (sum.row.pixelSize) this.sumColumnPixelSize = sum.row.pixelSize;
      }
      if (sum.total) {
        this.sumOfSum = true;
      }
    }

    if ("values" in data) this._data = data.values;
    if ("generator" in data) this.dataGenerator = data.generator;
    if (data.format) this.dataFormat = data.format;
  }

  /*
    data
   */
  generate(args: T): Grid<T, C, R>["_data"] {
    const dataGenerator = this.dataGenerator;
    if (!dataGenerator) throw new Error(`no dataGenerator set`);

    return (this._data = this.rowItems.map((row, rowIndex) =>
      this.columnItems.map((column, columnIndex) => dataGenerator(column, columnIndex, row, rowIndex, args))
    ));
  }

  get data(): (string | number)[][] {
    if (!this._data) throw new Error(`no data given. set data in constructor or set dataGenerator and generate`);

    // deep copy
    const data: (string | number)[][] = JSON.parse(JSON.stringify(this._data));

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.sumHeaderRow) data.unshift(this.sumHeaderRowData);

    if (this.showColumnHeader) {
      if (!this._columnItems) throw new Error("showColumnHeader requries columnItems");

      const converter = this.columnConverter;
      // @ts-ignore for most case this.columnItems are string[]
      const columnItems: (string | number)[] = converter ? this._columnItems.map(converter) : this._columnItems;

      data.unshift([...columnItems]);
    }

    // rows last
    // column header are added here
    if (this.showRowHeader) {
      if (!this._rowItems) throw new Error("showRowHeader requries rowItems");

      data.forEach((row, i) => row.unshift(this.rowItemsData[i]));
    }

    if (this.sumColumn || this.sumOfSum) {
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
      ...(this._rowItems
        ? converter
          ? this._rowItems.map(converter)
          : this._rowItems // XXX
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

    if (this.showColumnHeader) sumColumn.push("");
    if (this.sumHeaderRow) {
      if (this.sumOfSum) {
        // TODO: check sumColumn and sumRow is equal
        sumColumn.push(`=SUM(${this.sumHeaderRowOrigin?.toRange({ right: this.dataColumnLength - 1 })})`);
      } else {
        sumColumn.push("");
      }
    }

    if (this.sumColumn) {
      sumColumn.push(
        ...[...Array(this.dataRowLength).keys()].map(
          (i) => `=SUM(${this.dataOrigin.relative({ bottom: i }).toRange({ right: this.dataColumnLength - 1 })})`
        )
      );
    } else {
      sumColumn.push(...Array(this.dataRowLength).fill(""));
    }

    return sumColumn;
  }

  private get metadata(): (sheets_v4.Schema$CellFormat | undefined)[][] {
    const format = this.dataFormat;
    const data = this.rowItems.map((row, rowIndex) =>
      this.columnItems.map((column, columnIndex) => {
        switch (typeof format) {
          case "object":
            return Array.isArray(format) ? format[rowIndex][columnIndex] : format;
          case "function":
            return format(column, columnIndex, row, rowIndex);
          case "undefined":
            return;
          default:
            const never: never = format;
            throw never;
        }
      })
    );

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
            if (!this._columnItems) throw "never";
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

              row.unshift(index >= 0 ? rowHeaderFormat(this.rowItems[index], index) : undefined);
            });

            break;
          default:
            const never: never = rowHeaderFormat;
            throw never;
        }
      }
    }

    if (this.sumColumn || this.sumOfSum) {
      // TODO:
      data.forEach((row) => row.push(undefined));
    }

    return data;
  }

  /*
    metrics
   */
  get columnLength(): number {
    return (this.showRowHeader ? 1 : 0) + this.dataColumnLength + (this.sumColumn || this.sumOfSum ? 1 : 0);
  }

  private get dataColumnLength(): number {
    return this._columnItems?.length || (this._data ? this._data[0].length : 1);
  }

  get rowLength(): number {
    return (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0) + this.dataRowLength;
  }

  private get dataRowLength(): number {
    return this._rowItems?.length || (this._data ? this._data.length : 1);
  }

  get columnItems(): C[] {
    return this._columnItems || [...Array<C>(this.dataColumnLength)];
  }

  get rowItems(): R[] {
    return this._rowItems || [...Array<R>(this.dataRowLength)];
  }

  /*
    google spreadsheet griddata convertion
   */
  toGridData(args?: T): sheets_v4.Schema$GridData {
    if (args && !this._data) this.generate(args);

    const metadata = this.metadata;

    const data: sheets_v4.Schema$GridData = {
      startColumn: this.startColumn,
      startRow: this.startRow,
      rowData: this.data.map((row, i) => {
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

      if (this.sumColumn || this.sumOfSum)
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

  get sumHeaderRowOrigin(): Cell | undefined {
    return this.sumHeaderRow
      ? this.origin.relative({ right: this.showRowHeader ? 1 : 0, bottom: this.showColumnHeader ? 1 : 0 })
      : undefined;
  }

  get sumColumnOirigin(): Cell | undefined {
    return this.sumColumn
      ? this.origin.relative({ right: this.columnLength - 1, bottom: this.rowLength - this.dataRowLength })
      : undefined;
  }

  get sumOfSumOrigin(): Cell | undefined {
    return this.sumOfSum
      ? this.origin.relative({ right: this.columnLength - 1, bottom: this.showColumnHeader ? 1 : 0 })
      : undefined;
  }

  get dataOrigin(): Cell {
    return this.origin.relative({
      right: this.showRowHeader ? 1 : 0,
      bottom: (this.showColumnHeader ? 1 : 0) + (this.sumHeaderRow ? 1 : 0),
    });
  }

  findSumHeaderRowCell(column: C): Cell | undefined {
    const index = this.indexColumnOf(column);
    if (index < 0) return;

    return this.sumHeaderRowOrigin?.relative({ right: index });
  }

  findSumColumnCell(row: R): Cell | undefined {
    const index = this.indexRowOf(row);
    if (index < 0) return;

    return this.sumColumnOirigin?.relative({ bottom: index });
  }

  findDataCell({ column, row }: { column?: C; row?: R }): Cell | undefined {
    if (!this._columnItems && !this._rowItems) {
      if (column !== undefined || row !== undefined) throw new Error("you should set neighter column nor row");

      return this.dataOrigin;
    } else if (!this._columnItems) {
      if (column !== undefined) throw new Error("you should not set column");
      if (row === undefined) throw new Error("you should set row");

      const index = this.indexRowOf(row);
      return index >= 0 ? this.dataOrigin.relative({ bottom: index }) : undefined;
    } else if (!this._rowItems) {
      if (row !== undefined) throw new Error("you should not set row");
      if (column === undefined) throw new Error("you should set column");

      const index = this.indexColumnOf(column);
      return index >= 0 ? this.dataOrigin.relative({ right: index }) : undefined;
    }

    if (column === undefined || row === undefined) throw new Error("you should set both column and row");

    const columnIndex = this.indexColumnOf(column);
    const rowIndex = this.indexRowOf(row);

    return columnIndex >= 0 && rowIndex >= 0
      ? this.dataOrigin.relative({ right: columnIndex, bottom: rowIndex })
      : undefined;
  }

  private indexColumnOf(column: C): number {
    if (!this._columnItems) return -1;

    const index = this._columnItems.indexOf(column);
    if (index >= 0) return index;

    // use converter
    const converter = this.columnConverter;
    if (!converter) return index;

    return this._columnItems.findIndex((e, i) => converter(e, i) === converter(column, i));
  }

  private indexRowOf(row: R): number {
    if (!this._rowItems) return -1;

    const index = this._rowItems.indexOf(row);
    if (index >= 0) return index;

    // use converter
    const converter = this.rowConverter;
    if (!converter) return index;

    return this._rowItems.findIndex((e, i) => converter(e, i) === converter(row, i));
  }

  toRange(): string {
    return this.origin.toRange({ right: this.columnLength - 1, bottom: this.rowLength - 1 });
  }
}
