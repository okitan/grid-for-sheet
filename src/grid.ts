import { sheets_v4 } from "googleapis";

import { Cell } from "./cell";

export class Grid {
  public readonly startColumn: number = 0;
  public readonly startRow: number = 0;

  private _data?: (string | number)[][];

  constructor({
    startColumn,
    startRow,
    data,
  }: { data?: (string | number)[][] } & Partial<
    Pick<Grid, "startColumn" | "startRow">
  >) {
    if (startColumn) this.startColumn = startColumn;
    if (startRow) this.startRow = startRow;

    if (data) this._data = data;
  }

  getData(): (string | number)[][] {
    if (!this._data)
      throw new Error(
        `no data given. set data in constructor or set dataGenerator and calculate`
      );
    return this._data;
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
