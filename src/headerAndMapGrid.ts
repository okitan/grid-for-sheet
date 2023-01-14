import type { sheets_v4 } from "@googleapis/sheets";

import { Cell } from "./cell";

export type HeaderAndMapGridConstructor<T, C, R> = {
  sheet?: string;
  name?: string;
  startColumn?: number;
  startRow?: number;
  label?: string;
  column: (C extends string
    ? { items: string[] }
    : C extends number
    ? { items: number[] }
    : { items: C[]; converter: (column: C, columnIndex: number) => string | number }) & {
    pixelSize?: number;
    headerFormat?: sheets_v4.Schema$CellFormat;
  };
  row: (R extends string
    ? { items: string[] }
    : R extends number
    ? { items: number[] }
    : { items: R[]; converter: (row: R, rowIndex: number) => string | number }) & {
    pixelSize?: number;
  };
  lambda: string;
};

export class HeaderAndMapGrid<T = {}, C = string, R = string> {
  readonly sheet?: string;
  readonly name?: string;

  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  readonly gridLabel: string = "";

  readonly #column: HeaderAndMapGridConstructor<T, C, R>["column"];
  readonly #row: HeaderAndMapGridConstructor<T, C, R>["row"];

  readonly lambda: string;

  constructor({
    sheet,
    name,
    startColumn,
    startRow,
    label,
    column,
    row,
    lambda,
  }: HeaderAndMapGridConstructor<T, C, R>) {
    if (sheet) this.sheet = sheet;
    if (name) this.name = name;
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;
    if (label) this.gridLabel = label;

    this.#column = column;
    this.#row = row;

    this.lambda = lambda;
  }

  toGridData(): sheets_v4.Schema$GridData {
    const column = this.#column; // umhhhh...
    const columnLabels = "converter" in column ? column.items.map((e, i) => column.converter(e, i)) : column.items;

    const row = this.#row;
    const rowLabels = "converter" in row ? row.items.map((e, i) => row.converter(e, i)) : row.items;

    const gridData: sheets_v4.Schema$GridData = {
      startColumn: this.startColumn,
      startRow: this.startRow,
      rowData: [
        {
          values: [
            Cell.data(this.gridLabel),
            ...columnLabels.map((e, i) => {
              const data = Cell.data(`= {
  "${e}";
  MAP(${this.rowsRange}, ${this.makeIndent(this.lambda, 2, true)})
}`);
              return this.#column.headerFormat ? { userEnteredFormat: this.#column.headerFormat, ...data } : data;
            }),
          ],
        },
        ...rowLabels.map((e) => ({ values: [Cell.data(e)] })),
      ],
    };

    if (this.#row.pixelSize || this.#column.pixelSize) {
      gridData.columnMetadata = [
        this.#row.pixelSize ? { pixelSize: this.#row.pixelSize } : {},
        ...(this.#column.pixelSize ? this.#column.items.map((e) => ({ pixelSize: this.#column.pixelSize })) : []),
      ];
    }

    return gridData;
  }

  /*
    pointer for particular cell
   */
  get origin(): Cell {
    return new Cell({ sheet: this.sheet, column: this.startColumn, row: this.startRow });
  }

  get rowsRange() {
    return this.origin.relative({ bottom: 1 }).toRange({ bottom: this.#row.items.length });
  }

  private makeIndent(str: string, indent: number, exceptFirstLine: boolean = false) {
    return str
      .split("\n")
      .map((e, i) => `${i === 0 && exceptFirstLine ? "" : Array(indent).fill(" ").join("")}${e}`)
      .join("\n");
  }
}
