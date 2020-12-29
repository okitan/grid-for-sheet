import { Grid } from "../src";

describe(Grid, () => {
  describe("#getData", () => {
    test("returns data", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"] },
        row: { items: ["列1"] },
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([["文字", 1]]);
    });

    test("with showColumnHeader returns included headers", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1"] },
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([
        ["行1", "行2"],
        ["文字", 1],
      ]);
    });

    test("with showRowHeader returns included headers", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"] },
        row: { items: ["列1"], showHeader: true },
        data: [["文字", 1]],
      });

      expect(grid.getData()).toEqual([["列1", "文字", 1]]);
    });

    test("with showHeader both column and row returns included headers", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1"], showHeader: true },
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
        column: { items: ["行1", "行2"], sum: true },
        row: { items: ["列1", "列2"], showHeader: true },
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

    test("with sumOfSum but no sumRow options", () => {
      const grid = new Grid({
        startColumn: 1,
        startRow: 2,
        column: { items: ["行1", "行2"], showHeader: true, sum: true, sumOfSum: true },
        row: { items: ["列1", "列2"], showHeader: true },
        data: [
          ["文字1", 1],
          ["文字2", 2],
        ],
      });

      const expected = [
        ["", "行1", "行2", ""],
        ["計", "=SUM(C5:C6)", "=SUM(D5:D6)", "=SUM(C4:D4)"],
        ["列1", "文字1", 1, ""],
        ["列2", "文字2", 2, ""],
      ];

      expect(grid.getData()).toEqual(expected);
    });

    test("with every options", () => {
      const grid = new Grid({
        startColumn: 1,
        startRow: 2,
        column: { items: ["行1", "行2"], showHeader: true, sum: true, sumOfSum: true },
        row: { items: ["列1", "列2"], showHeader: true, sum: true },
        data: [
          ["文字1", 1],
          ["文字2", 2],
        ],
      });

      const expected = [
        ["", "行1", "行2", ""],
        ["計", "=SUM(C5:C6)", "=SUM(D5:D6)", "=SUM(C4:D4)"],
        ["列1", "文字1", 1, "=SUM(C5:D5)"],
        ["列2", "文字2", 2, "=SUM(C6:D6)"],
      ];

      expect(grid.getData()).toEqual(expected);

      expect(grid.getData().length).toEqual(grid.rowLength);
      expect(grid.getData()[0].length).toEqual(grid.columnLength);

      // check no data corruption
      expect(grid.getData()).toEqual(expected);
    });

    test("with dataGenerator returns generated data", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2"], showHeader: true, sum: true },
        row: { items: ["列1", "列2"], showHeader: true, sum: true },
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

    test("with dataGenerator and no columnItems nor rowItems generates only one data", () => {
      const grid = new Grid<{ hoge: string }>({
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      grid.generate({ hoge: "fuga" });

      const expected = [["fuga:undefined:0/undefined:0"]];

      expect(grid.getData()).toEqual(expected);

      expect(grid.getData().length).toEqual(grid.rowLength);
      expect(grid.getData()[0].length).toEqual(grid.columnLength);
    });

    test("with generics", () => {
      const grid = new Grid<{ hoge: string }, { fuga: string }, { ugu: string }>({
        column: {
          items: [{ fuga: "行1" }, { fuga: "行2" }],
          showHeader: true,
          sum: true,
          converter: (column, i) => `${column?.fuga}:${i}`,
        },
        row: {
          items: [{ ugu: "列1" }, { ugu: "列2" }],
          showHeader: true,
          sum: true,
          converter: (row, j) => `${row?.ugu}:${j}`,
        },
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column?.fuga}:${i}/${row?.ugu}:${j}`,
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

  test("with format returns formatted Griddata", () => {
    const grid = new Grid<{ hoge: string }>({
      column: {
        items: ["行1", "行2", "行3"],
        showHeader: true,
        sum: true,
        headerFormat: { textFormat: { bold: true } },
        pixelSize: 7,
        sumPixelSize: 8,
        sumOfSum: true,
      },
      row: {
        items: ["列1", "列2"],
        showHeader: true,
        sum: true,
        headerFormat: [{ textFormat: { fontSize: 1 } }, { textFormat: { fontSize: 2 } }],
      },
      dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
    });

    expect(grid.toGridData({ hoge: "fuga" })).toMatchInlineSnapshot(`
      Object {
        "columnMetadata": Array [
          Object {},
          Object {
            "pixelSize": 7,
          },
          Object {
            "pixelSize": 7,
          },
          Object {
            "pixelSize": 7,
          },
          Object {
            "pixelSize": 8,
          },
        ],
        "rowData": Array [
          Object {
            "values": Array [
              Object {
                "userEnteredValue": Object {
                  "stringValue": "",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textFormat": Object {
                    "bold": true,
                  },
                },
                "userEnteredValue": Object {
                  "stringValue": "行1",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textFormat": Object {
                    "bold": true,
                  },
                },
                "userEnteredValue": Object {
                  "stringValue": "行2",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textFormat": Object {
                    "bold": true,
                  },
                },
                "userEnteredValue": Object {
                  "stringValue": "行3",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "",
                },
              },
            ],
          },
          Object {
            "values": Array [
              Object {
                "userEnteredValue": Object {
                  "stringValue": "計",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(B3:B4)",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(C3:C4)",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(D3:D4)",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(B2:D2)",
                },
              },
            ],
          },
          Object {
            "values": Array [
              Object {
                "userEnteredFormat": Object {
                  "textFormat": Object {
                    "fontSize": 1,
                  },
                },
                "userEnteredValue": Object {
                  "stringValue": "列1",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行1:0/列1:0",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行2:1/列1:0",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行3:2/列1:0",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(B3:D3)",
                },
              },
            ],
          },
          Object {
            "values": Array [
              Object {
                "userEnteredFormat": Object {
                  "textFormat": Object {
                    "fontSize": 2,
                  },
                },
                "userEnteredValue": Object {
                  "stringValue": "列2",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行1:0/列2:1",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行2:1/列2:1",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "stringValue": "fuga:行3:2/列2:1",
                },
              },
              Object {
                "userEnteredValue": Object {
                  "formulaValue": "=SUM(B4:D4)",
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

  describe("#toRange", () => {
    test("returns notation", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2"], showHeader: true, sum: true },
        row: { items: ["列1", "列2"], showHeader: true, sum: true },
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      expect(grid.toRange()).toEqual("A1:D4");
    });
  });

  describe("#findSumHeaderRowCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: {
          items: ["行1", "行2", "行3"],
          showHeader: true,
          sum: true,
          headerFormat: { textFormat: { bold: true } },
          pixelSize: 7,
          sumPixelSize: 8,
        },
        row: {
          items: ["列1", "列2"],
          showHeader: true,
          sum: true,
          headerFormat: [{ textFormat: { fontSize: 1 } }, { textFormat: { fontSize: 2 } }],
        },
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      expect(grid.findSumHeaderRowCell("行2")?.notation).toEqual("C2");
    });
  });

  describe("#findSumColumnCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: {
          items: ["行1", "行2", "行3"],
          showHeader: true,
          sum: true,
          headerFormat: { textFormat: { bold: true } },
          pixelSize: 7,
          sumPixelSize: 8,
        },
        row: {
          items: ["列1", "列2"],
          showHeader: true,
          sum: true,
          headerFormat: [{ textFormat: { fontSize: 1 } }, { textFormat: { fontSize: 2 } }],
        },
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      expect(grid.findSumColumnCell("列2")?.notation).toEqual("E4");
    });
  });

  describe("#findDataCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: {
          items: ["行1", "行2", "行3"],
          showHeader: true,
          sum: true,
          headerFormat: { textFormat: { bold: true } },
          pixelSize: 7,
          sumPixelSize: 8,
        },
        row: {
          items: ["列1", "列2"],
          showHeader: true,
          sum: true,
          headerFormat: [{ textFormat: { fontSize: 1 } }, { textFormat: { fontSize: 2 } }],
        },
        dataGenerator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
      });

      expect(grid.findDataCell({ column: "行3", row: "列1" })?.notation).toEqual("D3");
    });
  });
});
