import { Grid } from "../src";

describe(Grid, () => {
  describe("#getData", () => {
    test("returns data", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        rowItems: ["列1"],
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([["文字", 1]]);
    });

    test("with showColumnHeader returns included headers", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        showColumnHeader: true,
        rowItems: ["列1"],
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([
        ["行1", "行2"],
        ["文字", 1],
      ]);
    });

    test("with showRowHeader returns included headers", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        rowItems: ["列1"],
        showRowHeader: true,
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([["列1", "文字", 1]]);
    });

    test("with showHeader both column and row returns included headers", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        showColumnHeader: true,
        rowItems: ["列1"],
        showRowHeader: true,
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([
        ["", "行1", "行2"],
        ["列1", "文字", 1],
      ]);
    });
  });

  describe("#girdData", () => {
    test("returns GridData", () => {
      const grid = new Grid({ data: [["文字", 1]] });

      expect(grid.toGridData()).toMatchInlineSnapshot(`
        Object {
          "rowData": Array [
            Object {
              "values": Array [
                Object {
                  "userEnteredValue": Object {
                    "stringValue": "文字",
                  },
                },
                Object {
                  "userEnteredValue": Object {
                    "numberValue": 1,
                  },
                },
              ],
            },
          ],
          "startColumn": 0,
          "startRow": 0,
        }
      `);
    });
  });
});
