import { sheets_v4 } from "googleapis";

export class Cell {
  static data(data: string | number): sheets_v4.Schema$CellData {
    switch (typeof data) {
      case "string":
        return { userEnteredValue: { stringValue: data } };
      case "number":
        return { userEnteredValue: { numberValue: data } };
      default:
        const never: never = data;
        throw never;
    }
  }

  static numberToColumnName(num: number): string {
    const quotient = Math.floor(num / 26);
    const remainder = num % 26;

    return (
      (quotient > 0 ? Cell.numberToColumnName(quotient - 1) : "") +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[remainder]
    );
  }

  column: number;
  row: number;

  constructor({ column, row }: Pick<Cell, "column" | "row">) {
    this.column = column;
    this.row = row;
  }

  get columnName(): string {
    return Cell.numberToColumnName(this.column);
  }

  get rowNumber(): number {
    return this.row + 1;
  }

  get notation(): string {
    return `${this.columnName}${this.rowNumber}`;
  }

  toRange(cellOrPosition?: Cell | { right?: number; bottom?: number }): string {
    switch (typeof cellOrPosition) {
      case "undefined":
        return this.notation;
      case "object":
        if ("notation" in cellOrPosition) {
          return `${this.notation}:${cellOrPosition.notation}`;
        } else {
          const position = cellOrPosition;

          const other = new Cell({
            column: this.column + (position.right || 0),
            row: this.row + (position.bottom || 0),
          });

          return this.toRange(other);
        }
      default:
        const never: never = cellOrPosition;
        throw never;
    }
  }
}
