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
}
