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

  readonly sumColumnHeader: boolean = false;

  constructor({
    startColumn,
    startRow,
    columnItems,
    showColumnHeader,
    sumColumnHeader,
    rowItems,
    showRowHeader,
    data,
  }: Partial<
    Pick<Grid<T, C, R>, "startColumn" | "startRow" | "sumColumnHeader">
  > & // with default
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

    if (sumColumnHeader) this.sumColumnHeader = sumColumnHeader;

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

    if (this.sumColumnHeader) data.unshift(this.getSumColumnHeader());

    if (this.showColumnHeader) {
      if (!this.columnItems)
        throw new Error("showColumnHeader requries columnItems");

      data.unshift([...this.columnItems]);
    }

    if (this.showRowHeader) {
      if (!this.rowItems) throw new Error("showRowHeader requries rowItems");

      data.forEach((row, i) => row.unshift(this.getRowItems()[i]));
    }

    return data;
  }

  private getRowItems(): string[] {
    const rowItems = this.rowItems
      ? this.rowItems
      : this.data
      ? this.data.map(() => "")
      : [""];

    return [
      this.showColumnHeader ? "" : undefined,
      this.sumColumnHeader ? "計" : undefined,
      ...rowItems,
    ].filter((e): e is string => typeof e !== "undefined");
  }

  private getSumColumnHeader(): string[] {
    const columnOffset = this.startColumn + (this.showRowHeader ? 1 : 0);

    return (this.columnItems || (this.data ? this.data[0] : [""])).map(
      (_, i) => {
        const from = new Cell({
          column: columnOffset + i,
          row: this.startRow + (this.showColumnHeader ? 1 : 0) + 1,
        });
        const to = new Cell({
          column: columnOffset + i,
          row: this.startRow + this.getRowItems().length - 1,
        });

        return `=SUM(${from.toRange(to)})`;
      }
    );
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
