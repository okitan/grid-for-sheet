import type { sheets_v4 } from "@googleapis/sheets";

import { Cell } from "./cell";

export type HeaderAndMapGridConstructor<T, C, R> = {
  sheet?: string;
  name?: string;
  startColumn?: number;
  startRow?: number;
  label?: string;
  column: {
    items: C[];
    converter?: (column: C, columnIndex: number) => string | number;
    pixelSize?: number;
    headerFormat?: sheets_v4.Schema$CellFormat | ((column: C, columnIndex: number) => sheets_v4.Schema$CellFormat);
  };
  row: {
    items: R[];
    converter?: (row: R, rowIndex: number) => string | number;
    pixelSize?: number;
    headerFormat?: sheets_v4.Schema$CellFormat | ((row: R, rowIndex: number) => sheets_v4.Schema$CellFormat);
  };
  lambda: string | ((column: C, columnIndex: number, args: T) => string);
};

export class HeaderAndMapGrid<T = {}, C = string, R = string> {
  readonly sheet?: string;
  readonly name?: string;

  readonly startColumn: number = 0;
  readonly startRow: number = 0;

  readonly gridLabel: string = "";

  readonly #column: HeaderAndMapGridConstructor<T, C, R>["column"];
  readonly #row: HeaderAndMapGridConstructor<T, C, R>["row"];

  readonly lambda: HeaderAndMapGridConstructor<T, C, R>["lambda"];

  #data: string[] | null = null;

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

  generate(args: T) {
    const lambda = this.lambda;
    if (typeof lambda !== "function") throw new Error(`no dataGenerator set`);

    this.#data = this.#column.items.map((e, i) => lambda(e, i, args));
  }

  get data(): string[] {
    const data = this.#data;
    if (!data) throw new Error(`no data given. generate needed`);

    return data;
  }

  toGridData(): sheets_v4.Schema$GridData {
    const gridData: sheets_v4.Schema$GridData = {
      startColumn: this.startColumn,
      startRow: this.startRow,
      rowData: [
        // header
        {
          values: [
            Cell.data(this.gridLabel),
            ...this.#column.items.map((e, i) => {
              const label = this.#column.converter ? this.#column.converter(e, i) : e;

              if (typeof label !== "string" && typeof label !== "number") throw new Error(`column should converted`);

              const lambda = typeof this.lambda === "string" ? this.lambda : this.data[i];

              const data = Cell.data(`= {
  "${label}";
  MAP(${this.rowsRange}, ${this.makeIndent(lambda, 2, true)})
}`);

              const userEnteredFormat = this.#column.headerFormat
                ? typeof this.#column.headerFormat === "function"
                  ? this.#column.headerFormat(e, i)
                  : this.#column.headerFormat
                : undefined;

              return userEnteredFormat ? { userEnteredFormat, ...data } : data;
            }),
          ],
        },
        // rows
        ...this.#row.items.map((e, i) => {
          const label = this.#row.converter ? this.#row.converter(e, i) : e;
          if (typeof label !== "string" && typeof label !== "number") throw new Error(`row should converted`);

          const userEnteredFormat = this.#row.headerFormat
            ? typeof this.#row.headerFormat === "function"
              ? this.#row.headerFormat(e, i)
              : this.#row.headerFormat
            : undefined;

          return userEnteredFormat
            ? { values: [{ userEnteredFormat, ...Cell.data(label) }] }
            : { values: [Cell.data(label)] };
        }),
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
