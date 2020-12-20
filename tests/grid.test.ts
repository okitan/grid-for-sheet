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

      const expected = [
        ["", "行1", "行2"],
        ["列1", "文字", 1],
      ];

      expect(grid.getData()).toEqual(expected);

      // check no data corruption
      expect(grid.getData()).toEqual(expected);
    });

    test("with sumColumnHeader and no showColumnHeader", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        sumHeaderRow: true,
        rowItems: ["列1", "列2"],
        showRowHeader: true,
        data: [
          ["文字1", 1],
          ["文字2", 2],
        ],
      });

      const expected = [
        ["計", "=SUM(B2:B3)", "=SUM(C2:C3)"],
        ["列1", "文字1", 1],
        ["列2", "文字2", 2],
      ];

      expect(grid.getData()).toEqual(expected);
    });

    test("with every options", () => {
      const grid = new Grid({
        columnItems: ["行1", "行2"],
        showColumnHeader: true,
        sumHeaderRow: true,
        sumColumn: true,
        rowItems: ["列1", "列2"],
        showRowHeader: true,
        data: [
          ["文字1", 1],
          ["文字2", 2],
        ],
      });

      const expected = [
        ["", "行1", "行2", ""],
        ["計", "=SUM(B3:B4)", "=SUM(C3:C4)", ""],
        ["列1", "文字1", 1, "=SUM(B3:C3)"],
        ["列2", "文字2", 2, "=SUM(B4:C4)"],
      ];

      expect(grid.getData()).toEqual(expected);

      expect(grid.getData().length).toEqual(grid.rowLength);
      expect(grid.getData()[0].length).toEqual(grid.columnLength);

      // check no data corruption
      expect(grid.getData()).toEqual(expected);
    });

    test("with dataGenerator returns generated data", () => {
      const grid = new Grid<{ hoge: string }>({
        columnItems: ["行1", "行2"],
        showColumnHeader: true,
        sumHeaderRow: true,
        sumColumn: true,
        rowItems: ["列1", "列2"],
        showRowHeader: true,
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      grid.generate({ hoge: "fuga" });

      const expected = [
        ["", "行1", "行2", ""],
        ["計", "=SUM(B3:B4)", "=SUM(C3:C4)", ""],
        ["列1", "fuga:行1:0/列1:0", "fuga:行2:1/列1:0", "=SUM(B3:C3)"],
        ["列2", "fuga:行1:0/列2:1", "fuga:行2:1/列2:1", "=SUM(B4:C4)"],
      ];

      expect(grid.getData()).toEqual(expected);

      expect(grid.getData().length).toEqual(grid.rowLength);
      expect(grid.getData()[0].length).toEqual(grid.columnLength);

      // check no data corruption
      expect(grid.getData()).toEqual(expected);
    });

    test("with generics", () => {
      const grid = new Grid<{ hoge: string }, { fuga: string }, { ugu: string }>({
        columnItems: ["行1", { fuga: "行2" }],
        showColumnHeader: true,
        sumHeaderRow: true,
        sumColumn: true,
        rowItems: ["列1", { ugu: "列2" }],
        showRowHeader: true,
        dataGenerator: (column, i, row, j, args) =>
          `${args.hoge}:${typeof column === "string" ? column : column.fuga}:${i}/${
            typeof row === "string" ? row : row.ugu
          }:${j}`,
        columnConverter: (column, i) => `${typeof column === "string" ? column : column.fuga}:${i}`,
        rowConverter: (row, j) => `${typeof row === "string" ? row : row.ugu}:${j}`,
      });

      grid.generate({ hoge: "fuga" });

      const expected = [
        ["", "行1:0", "行2:1", ""],
        ["計", "=SUM(B3:B4)", "=SUM(C3:C4)", ""],
        ["列1:0", "fuga:行1:0/列1:0", "fuga:行2:1/列1:0", "=SUM(B3:C3)"],
        ["列2:1", "fuga:行1:0/列2:1", "fuga:行2:1/列2:1", "=SUM(B4:C4)"],
      ];

      expect(grid.getData()).toEqual(expected);
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
