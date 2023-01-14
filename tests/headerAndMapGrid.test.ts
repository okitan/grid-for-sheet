import { HeaderAndMapGrid } from "../src";

describe(HeaderAndMapGrid, () => {
  describe("#toGridData", () => {
    test("works", () => {
      const grid = new HeaderAndMapGrid({
        column: { items: ["c1", "c2"], headerFormat: { backgroundColor: { red: 1 } }, pixelSize: 56 },
        row: { items: ["r1", "r2"], pixelSize: 24 },
        lambda: `LAMBDA(r,
  r
)`,
      });
      expect(grid.toGridData()).toMatchInlineSnapshot(`
        {
          "columnMetadata": [
            {
              "pixelSize": 24,
            },
            {
              "pixelSize": 56,
            },
            {
              "pixelSize": 56,
            },
          ],
          "rowData": [
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "",
                  },
                },
                {
                  "userEnteredFormat": {
                    "backgroundColor": {
                      "red": 1,
                    },
                  },
                  "userEnteredValue": {
                    "formulaValue": "= {
          "c1";
          MAP(A2:A4, LAMBDA(r,
            r
          ))
        }",
                  },
                },
                {
                  "userEnteredFormat": {
                    "backgroundColor": {
                      "red": 1,
                    },
                  },
                  "userEnteredValue": {
                    "formulaValue": "= {
          "c2";
          MAP(A2:A4, LAMBDA(r,
            r
          ))
        }",
                  },
                },
              ],
            },
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "r1",
                  },
                },
              ],
            },
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "r2",
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

    test("with converter works", () => {
      // TODO:
      const grid = new HeaderAndMapGrid({
        column: { items: [{ c: 1 }, { c: 2 }], converter: (e) => `c${e.c}` },
        row: { items: [{ r: 1 }, { r: 2 }], converter: (e) => `r${e.r}` },
        lambda: `LAMBDA(r,
  r
)`,
      });
      expect(grid.toGridData()).toMatchInlineSnapshot(`
        {
          "rowData": [
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "",
                  },
                },
                {
                  "userEnteredValue": {
                    "formulaValue": "= {
          "c1";
          MAP(A2:A4, LAMBDA(r,
            r
          ))
        }",
                  },
                },
                {
                  "userEnteredValue": {
                    "formulaValue": "= {
          "c2";
          MAP(A2:A4, LAMBDA(r,
            r
          ))
        }",
                  },
                },
              ],
            },
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "r1",
                  },
                },
              ],
            },
            {
              "values": [
                {
                  "userEnteredValue": {
                    "stringValue": "r2",
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
