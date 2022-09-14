import { Cell } from "../src";

describe(Cell, () => {
  describe(".data", () => {
    test("with string returns stringValue", () => {
      expect(Cell.data("文字")).toMatchInlineSnapshot(`
        {
          "userEnteredValue": {
            "stringValue": "文字",
          },
        }
      `);
    });

    test("with string starting with = returns formulaValue", () => {
      expect(Cell.data("=1+1")).toMatchInlineSnapshot(`
        {
          "userEnteredValue": {
            "formulaValue": "=1+1",
          },
        }
      `);
    });

    test("with number returns numberValue", () => {
      expect(Cell.data(1)).toMatchInlineSnapshot(`
        {
          "userEnteredValue": {
            "numberValue": 1,
          },
        }
      `);
    });
  });

  describe(".numberToColumnName", () => {
    test.each([
      [0, "A"],
      [26 - 1, "Z"],
      [26 ** 1, "AA"],
      [26 ** 1 + 26 ** 2 - 1, "ZZ"],
      [26 ** 1 + 26 ** 2, "AAA"],
    ])("with column %i returns %s", (column, expected) => {
      expect(Cell.numberToColumnName(column)).toEqual(expected);
    });
  });

  describe("#toRange", () => {
    test("without args returns self notation", () => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange()).toEqual("B2");
    });

    test("with other cell retuns range", () => {
      const cell = new Cell({ column: 1, row: 1 });
      const other = new Cell({ column: 2, row: 2 });

      expect(cell.toRange(other)).toEqual("B2:C3");
    });

    test("with sheet title", () => {
      const cell = new Cell({ sheet: "シート", column: 1, row: 1 });
      const other = new Cell({ sheet: "シート", column: 2, row: 2 });

      expect(cell.toRange(other)).toEqual("'シート'!B2:C3");
    });

    test.each([
      [{ right: 1 }, "B2:C2"],
      [{ bottom: 1 }, "B2:B3"],
    ])("with %o returns %s", (position, expected) => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange(position)).toEqual(expected);
    });

    test("with leftEnd works", () => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange("leftEnd")).toEqual("A2:B2");
    });
    test("with rightEnd works", () => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange("rightEnd")).toEqual("B2:2");
    });
    test("with topEnd works", () => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange("topEnd")).toEqual("B1:B2");
    });
    test("with bottomEnd works", () => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange("bottomEnd")).toEqual("B2:B");
    });
  });
});
