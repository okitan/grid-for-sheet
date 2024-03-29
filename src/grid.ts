import type { sheets_v4 } from "@googleapis/sheets";

import { Cell } from "./cell";

export type GridConstructor<T, C, R> = {
  sheet?: string;
  name?: string;
  startColumn?: number;
  startRow?: number;
  label?: string; // only shown when both showColumnHeader and showRowHeader are true
  column?: { pixelSize?: number } & (
    | ({
        showHeader: true;
        items: C[];
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
        items: R[];
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
    column?:
      | true
      | {
          label?: string;
        };
    row?:
      | true
      | {
          label?: string; // only shown when showColumnHeader is true
          labelFormat?: Grid<T, C, R>["rowTotalLabelFormat"];
          pixelSize?: number;
        };
  };
  data: { format?: Grid<T, C, R>["dataFormat"] } & (
    | {
        values: (string | number | undefined)[][];
      }
    | {
        generator: Grid<T, C, R>["dataGenerator"];
      }
  );
};

export class Grid<T = {}, C = string, R = string> {
  readonly sheet?: string;
  readonly name?: string;

  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  readonly gridLabel: string = "";

  private _data?: (string | number | undefined)[][];
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

  readonly columnTotalHeader: boolean = false;
  readonly columnTotalHeaderLabel: string = "SUM";

  readonly rowTotal: boolean = false;
  readonly rowTotalLabel: string = "SUM";
  readonly rowTotalLabelFormat?: sheets_v4.Schema$CellFormat;
  readonly rowTotalPixelSize?: number;

  // dynamic
  readonly dataGenerator?: (
    column: C,
    columnIndex: number,
    row: R,
    rowIndex: number,
    args: T,
    thisArg: Grid<T, C, R>
  ) => string | number | undefined;

  constructor({ sheet, name, startColumn, startRow, label, column, row, sum, data }: GridConstructor<T, C, R>) {
    if (sheet) this.sheet = sheet;
    if (name) this.name = name;
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;
    if (label) this.gridLabel = label;

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
        this.columnTotalHeader = true;
        if (typeof sum.column === "object") {
          if (sum.column.label) this.columnTotalHeaderLabel = sum.column.label;
        }
      }
      if (sum.row) {
        this.rowTotal = true;
        if (typeof sum.row === "object") {
          if (sum.row.label) this.rowTotalLabel = sum.row.label;
          if (sum.row.labelFormat) this.rowTotalLabelFormat = sum.row.labelFormat;
          if (sum.row.pixelSize) this.rowTotalPixelSize = sum.row.pixelSize;
        }
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
      this.columnItems.map((column, columnIndex) => dataGenerator(column, columnIndex, row, rowIndex, args, this))
    ));
  }

  /*
    basic algorithm
         A     B     C     D
    1 |     | C1  | C2  |     | ← columnHeader
    2 |     | SUM | SUM | SOS | ← columnTotalHeader
    3 | R1  | DAT | DAT | SUM |
    4 | R2  | DAT | DAT | SUM |
      ↑ rowHeader        ↑ rowTotal

    0. Given data (B3:C4)
    1. columns turn (Note: do not treat rowHeader and rowTotal in this turn.)
      1.1. insert columnTotalHeaderData(B2:C2)
      1.2. insert columnHeaderLabels(B1:C1)
    2. row turn
      2.1 insert rowHeader(A1:A4)
      2.2 insert rowTotal(D1:D4)
   */
  get data(): (string | number | undefined)[][] {
    if (!this._data) throw new Error(`no data given. set data in constructor or set dataGenerator and generate`);

    // subsequent process disrupt array
    const data: (string | number | undefined)[][] = this._data.map((row) => [...row]);

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.columnTotalHeader) data.unshift(this.columnTotalHeaderData);

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

    if (this.rowTotal) {
      data.forEach((row, i) => row.push(this.rowTotalData[i]));
    }

    return data;
  }

  private get rowItemsData(): (string | number)[] {
    const rowItems: (string | number)[] = [];

    if (this.showColumnHeader) rowItems.push(this.gridLabel);
    if (this.columnTotalHeader) rowItems.push(this.columnTotalHeaderLabel);

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

  // this does not consider showRowHeader and rowTotal
  private get columnTotalHeaderData(): string[] {
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return [...Array(this.dataColumnLength).keys()].map((i) => {
      const from = new Cell({ column: columnOffset + i, row: this.startRow + (this.showColumnHeader ? 1 : 0) + 1 });
      const to = new Cell({ column: columnOffset + i, row: this.startRow + this.rowItemsData.length - 1 });

      return `=SUM(${from.toRange(to, { local: true })})`;
    });
  }

  private get rowTotalData(): string[] {
    const rowTotal: string[] = [];

    if (this.showColumnHeader) rowTotal.push(this.rowTotalLabel);
    if (this.columnTotalHeader) {
      if (this.columnTotalHeader && this.rowTotal) {
        // TODO: check rowTotal and sumRow is equal
        rowTotal.push(
          `=SUM(${this.columnTotalHeaderOrigin?.toRange({ right: this.dataColumnLength - 1 }, { local: true })})`
        );
      } else {
        rowTotal.push("");
      }
    }

    if (this.rowTotal) {
      rowTotal.push(
        ...[...Array(this.dataRowLength).keys()].map(
          (i) =>
            `=SUM(${this.dataOrigin
              .relative({ bottom: i })
              .toRange({ right: this.dataColumnLength - 1 }, { local: true })})`
        )
      );
    } else {
      rowTotal.push(...Array(this.dataRowLength).fill(""));
    }

    return rowTotal;
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
            throw new Error(never);
        }
      })
    );

    // columns first
    // Note: do not consider rowHeader's column header
    if (this.columnTotalHeader) {
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
            throw new Error(never);
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
              const index = i - (this.showColumnHeader ? 1 : 0) - (this.columnTotalHeader ? 1 : 0);

              row.unshift(
                index >= 0 ? (Array.isArray(rowHeaderFormat) ? rowHeaderFormat[index] : rowHeaderFormat) : undefined
              );
            });
            break;
          case "function":
            data.forEach((row, i) => {
              const index = i - (this.showColumnHeader ? 1 : 0) - (this.columnTotalHeader ? 1 : 0);

              row.unshift(index >= 0 ? rowHeaderFormat(this.rowItems[index], index) : undefined);
            });

            break;
          default:
            const never: never = rowHeaderFormat;
            throw new Error(never);
        }
      }
    }

    if (this.rowTotal) {
      // TODO: rowHeaderFormat
      if (this.showColumnHeader) {
        data[0].push(this.rowTotalLabelFormat);
        data.slice(1).forEach((row) => row.push(undefined));
      } else {
        data.forEach((row) => row.push(undefined));
      }
    }

    return data;
  }

  /*
    metrics
   */
  get columnLength(): number {
    return (this.showRowHeader ? 1 : 0) + this.dataColumnLength + (this.rowTotal ? 1 : 0);
  }

  private get dataColumnLength(): number {
    return this._columnItems?.length || (this._data ? this._data[0].length : 1);
  }

  get rowLength(): number {
    return (this.showColumnHeader ? 1 : 0) + (this.columnTotalHeader ? 1 : 0) + this.dataRowLength;
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
    if (this.rowHeaderPixelSize || this.columnPixelSize || this.rowTotalPixelSize) {
      data.columnMetadata = [];

      if (this.showRowHeader)
        data.columnMetadata.push(this.rowHeaderPixelSize ? { pixelSize: this.rowHeaderPixelSize } : {});

      data.columnMetadata.push(
        ...Array(this.dataColumnLength).fill(this.columnPixelSize ? { pixelSize: this.columnPixelSize } : {})
      );

      if (this.rowTotal) data.columnMetadata.push(this.rowTotalPixelSize ? { pixelSize: this.rowTotalPixelSize } : {});
    }

    return data;
  }

  /*
    pointer for particular cell
   */
  get origin(): Cell {
    return new Cell({ sheet: this.sheet, column: this.startColumn, row: this.startRow });
  }

  get columnHeaderRange(): string | undefined {
    return this.showColumnHeader ? this.origin.toRange({ right: this.columnLength - 1 }) : undefined;
  }

  get rowHeaderRange(): string | undefined {
    return this.showRowHeader ? this.origin.toRange({ bottom: this.rowLength - 1 }) : undefined;
  }

  get columnTotalHeaderOrigin(): Cell | undefined {
    return this.columnTotalHeader
      ? this.origin.relative({ right: this.showRowHeader ? 1 : 0, bottom: this.showColumnHeader ? 1 : 0 })
      : undefined;
  }

  get rowTotalOirigin(): Cell | undefined {
    return this.rowTotal
      ? this.origin.relative({ right: this.columnLength - 1, bottom: this.rowLength - this.dataRowLength })
      : undefined;
  }

  get sumOfSumOrigin(): Cell | undefined {
    return this.columnTotalHeader && this.rowTotal
      ? this.origin.relative({ right: this.columnLength - 1, bottom: this.showColumnHeader ? 1 : 0 })
      : undefined;
  }

  get dataOrigin(): Cell {
    return this.origin.relative({
      right: this.showRowHeader ? 1 : 0,
      bottom: (this.showColumnHeader ? 1 : 0) + (this.columnTotalHeader ? 1 : 0),
    });
  }

  findColumnHeaderCell(column: C): Cell | undefined {
    const index = this.indexColumnOf(column);
    if (index < 0) return;

    return this.origin.relative({ right: this.showRowHeader ? index + 1 : index });
  }

  findcolumnTotalHeaderCell(column: C): Cell | undefined {
    const index = this.indexColumnOf(column);
    if (index < 0) return;

    return this.columnTotalHeaderOrigin?.relative({ right: index });
  }

  findRowHeaderCell(row: R): Cell | undefined {
    const index = this.indexRowOf(row);
    if (index < 0) return;

    return this.origin?.relative({
      bottom: this.showColumnHeader ? (this.columnTotalHeader ? index + 2 : index + 1) : index,
    });
  }

  findrowTotalCell(row: R): Cell | undefined {
    const index = this.indexRowOf(row);
    if (index < 0) return;

    return this.rowTotalOirigin?.relative({ bottom: index });
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

  toRange(opts?: { local: true }): string {
    return this.origin.toRange({ right: this.columnLength - 1, bottom: this.rowLength - 1 }, opts);
  }

  toGridRange(): sheets_v4.Schema$GridRange {
    return {
      startRowIndex: this.startRow,
      endRowIndex: this.startRow + this.rowLength,
      startColumnIndex: this.startColumn,
      endColumnIndex: this.startColumn + this.columnLength,
    };
  }

  /*
   * Function Generation
   */
  generateXlookupForRowFunc(column: C, row: R | string): string {
    if (!this.showColumnHeader || !this.showRowHeader) throw new Error(`showColumnHeader and showRowHeader needed`);

    const rLabel = typeof row === "string" ? row : this.rowConverter ? this.rowConverter(row, NaN) : undefined;
    if (!rLabel) throw new Error(`set row converter`);

    return `XLOOKUP("${rLabel}", ${this.rowHeaderRange}, ${this.findColumnHeaderCell(column)!.toRange({
      bottom: this.columnLength - 1,
    })})`;
  }

  generateXlookupForColumnFunc(column: C | string, row: R): string {
    if (!this.showColumnHeader || !this.showRowHeader) throw new Error(`showColumnHeader and showRowHeader needed`);

    const cLabel =
      typeof column === "string" ? column : this.columnConverter ? this.columnConverter(column, NaN) : undefined;
    if (!cLabel) throw new Error(`set row converter`);

    return `XLOOKUP("${cLabel}", ${this.columnHeaderRange}, ${this.findRowHeaderCell(row)!.toRange({
      right: this.rowLength - 1,
    })})`;
  }
}
