import { sheets_v4 } from "googleapis";

export class Cell {
  static data(data: string | number): sheets_v4.Schema$CellData {
    switch (typeof data) {
      case "string":
        if (data.startsWith("=")) {
          return { userEnteredValue: { formulaValue: data } };
        } else {
          return { userEnteredValue: { stringValue: data } };
        }
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

    return (quotient > 0 ? Cell.numberToColumnName(quotient - 1) : "") + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[remainder];
  }

  sheet?: string;
  column: number;
  row: number;

  constructor({ sheet, column, row }: Pick<Cell, "sheet" | "column" | "row">) {
    this.sheet = sheet;

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
    return this.sheet
      ? `${this.escapeSheetName(this.sheet)}!${this.columnName}${this.rowNumber}`
      : `${this.columnName}${this.rowNumber}`;
  }

  relative({ right = 0, bottom = 0 }: { right?: number; bottom?: number }): Cell {
    return new Cell({ sheet: this.sheet, column: this.column + right, row: this.row + bottom });
  }

  toRange(cellOrPosition?: Cell | { right?: number; bottom?: number }): string {
    switch (typeof cellOrPosition) {
      case "undefined":
        return this.notation;
      case "object":
        if ("notation" in cellOrPosition) {
          const otherCellNotation = cellOrPosition.notation;

          // TODO: check sheet title is the same
          return `${this.notation}:${
            otherCellNotation.includes("!") ? otherCellNotation.split("!")[1] : otherCellNotation
          }`;
        } else {
          return this.toRange(this.relative({ right: cellOrPosition.right || 0, bottom: cellOrPosition.bottom || 0 }));
        }
      default:
        const never: never = cellOrPosition;
        throw never;
    }
  }

  protected escapeSheetName(str: string): string {
    return str.match(/^[a-zA-Z]+$/) ? str : `'${str}'`;
  }
}
