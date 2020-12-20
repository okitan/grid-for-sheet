import { Cell } from "../src";

describe(Cell, () => {
  describe(".data", () => {
    test("with string returns stringValue", () => {
      expect(Cell.data("文字")).toMatchInlineSnapshot(`
        Object {
          "userEnteredValue": Object {
            "stringValue": "文字",
          },
        }
      `);
    });

    test("with string starting with = returns formulaValue", () => {
      expect(Cell.data("=1+1")).toMatchInlineSnapshot(`
        Object {
          "userEnteredValue": Object {
            "formulaValue": "=1+1",
          },
        }
      `);
    });

    test("with number returns numberValue", () => {
      expect(Cell.data(1)).toMatchInlineSnapshot(`
        Object {
          "userEnteredValue": Object {
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

    test.each([
      [{ right: 1 }, "B2:C2"],
      [{ bottom: 1 }, "B2:B3"],
    ])("with %o returns %s", (position, expected) => {
      const cell = new Cell({ column: 1, row: 1 });

      expect(cell.toRange(position)).toEqual(expected);
    });
  });
});
