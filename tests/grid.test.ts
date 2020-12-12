import { Grid } from "../src";

describe(Grid, () => {
  describe("#getData", () => {
    test("returns data", () => {
      const grid = new Grid({ data: [["文字", 1]] });

      expect(grid.getData()).toEqual([["文字", 1]]);
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
