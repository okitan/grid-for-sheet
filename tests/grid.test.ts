import { Grid } from "../src";

describe(Grid, () => {
  describe("#data", () => {
    test("returns data", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"] },
        row: { items: ["列1"] },
        data: { values: [["文字", 1]] },
      });

      expect(grid.data).toEqual([["文字", 1]]);
    });

    test("with showColumnHeader returns included headers", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1"] },
        data: { values: [["文字", 1]] },
      });

      expect(grid.data).toEqual([
        ["行1", "行2"],
        ["文字", 1],
      ]);
    });

    test("with showRowHeader returns included headers", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"] },
        row: { items: ["列1"], showHeader: true },
        data: { values: [["文字", 1]] },
      });

      expect(grid.data).toEqual([["列1", "文字", 1]]);
    });

    test("with showHeader both column and row returns included headers", () => {
      const grid = new Grid({
        label: "ラベル",
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1"], showHeader: true },
        data: { values: [["文字", 1]] },
      });

      const expected = [
        ["ラベル", "行1", "行2"],
        ["列1", "文字", 1],
      ];

      expect(grid.data).toEqual(expected);

      // check no data corruption
      expect(grid.data).toEqual(expected);
    });

    test("with sumColumnHeader and no showColumnHeader", () => {
      const grid = new Grid({
        column: { items: ["行1", "行2"] },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: { label: "列計" } },
        data: {
          values: [
            ["文字1", 1],
            ["文字2", 2],
          ],
        },
      });

      const expected = [
        ["列計", "=SUM(B2:B3)", "=SUM(C2:C3)"],
        ["列1", "文字1", 1],
        ["列2", "文字2", 2],
      ];

      expect(grid.data).toEqual(expected);
    });

    test("with every options", () => {
      const grid = new Grid({
        sheet: "シート",
        startColumn: 1,
        startRow: 2,
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: { label: "列計" }, row: { label: "総計" } },
        data: {
          values: [
            ["文字1", 1],
            ["文字2", 2],
          ],
        },
      });

      const expected = [
        ["", "行1", "行2", "総計"],
        ["列計", "=SUM(C5:C6)", "=SUM(D5:D6)", "=SUM(C4:D4)"],
        ["列1", "文字1", 1, "=SUM(C5:D5)"],
        ["列2", "文字2", 2, "=SUM(C6:D6)"],
      ];

      expect(grid.data).toEqual(expected);

      expect(grid.data.length).toEqual(grid.rowLength);
      expect(grid.data[0].length).toEqual(grid.columnLength);

      // check no data corruption
      expect(grid.data).toEqual(expected);
    });

    test("with dataGenerator returns generated data", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: { label: "列計" }, row: { label: "総計" } },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      grid.generate({ hoge: "fuga" });

      const expected = [
        ["", "行1", "行2", "総計"],
        ["列計", "=SUM(B3:B4)", "=SUM(C3:C4)", "=SUM(B2:C2)"],
        ["列1", "fuga:行1:0/列1:0", "fuga:行2:1/列1:0", "=SUM(B3:C3)"],
        ["列2", "fuga:行1:0/列2:1", "fuga:行2:1/列2:1", "=SUM(B4:C4)"],
      ];

      expect(grid.data).toEqual(expected);

      expect(grid.data.length).toEqual(grid.rowLength);
      expect(grid.data[0].length).toEqual(grid.columnLength);

      // check no data corruption
      expect(grid.data).toEqual(expected);
    });

    test("with dataGenerator and no columnItems nor rowItems generates only one data", () => {
      const grid = new Grid<{ hoge: string }>({
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      grid.generate({ hoge: "fuga" });

      const expected = [["fuga:undefined:0/undefined:0"]];

      expect(grid.data).toEqual(expected);

      expect(grid.data.length).toEqual(grid.rowLength);
      expect(grid.data[0].length).toEqual(grid.columnLength);
    });

    test("with generics", () => {
      const grid = new Grid<{ hoge: string }, { fuga: string }, { ugu: string }>({
        column: {
          items: [{ fuga: "行1" }, { fuga: "行2" }],
          showHeader: true,
          converter: (column, i) => `${column?.fuga}:${i}`,
        },
        row: {
          items: [{ ugu: "列1" }, { ugu: "列2" }],
          showHeader: true,
          converter: (row, j) => `${row?.ugu}:${j}`,
        },
        sum: { column: { label: "列計" }, row: { label: "総計" } },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column?.fuga}:${i}/${row?.ugu}:${j}` },
      });

      grid.generate({ hoge: "fuga" });

      const expected = [
        ["", "行1:0", "行2:1", "総計"],
        ["列計", "=SUM(B3:B4)", "=SUM(C3:C4)", "=SUM(B2:C2)"],
        ["列1:0", "fuga:行1:0/列1:0", "fuga:行2:1/列1:0", "=SUM(B3:C3)"],
        ["列2:1", "fuga:行1:0/列2:1", "fuga:行2:1/列2:1", "=SUM(B4:C4)"],
      ];

      expect(grid.data).toEqual(expected);
    });
  });

  describe("#girdData", () => {
    test("returns GridData", () => {
      const grid = new Grid({
        data: {
          values: [["文字", 1]],
          format: [[{ textDirection: "1" }, { textDirection: "2" }]],
        },
      });

      expect(grid.toGridData()).toMatchInlineSnapshot(`
        Object {
          "rowData": Array [
            Object {
              "values": Array [
                Object {
                  "userEnteredFormat": Object {
                    "textDirection": "1",
                  },
                  "userEnteredValue": Object {
                    "stringValue": "文字",
                  },
                },
                Object {
                  "userEnteredFormat": Object {
                    "textDirection": "2",
                  },
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

  test("with datagenerator returns undefined", () => {
    const grid = new Grid({
      data: {
        generator: () => undefined,
      },
    });

    expect(grid.toGridData({})).toMatchInlineSnapshot(`
      Object {
        "rowData": Array [
          Object {
            "values": Array [
              Object {},
            ],
          },
        ],
        "startColumn": 0,
        "startRow": 0,
      }
    `);
  });

  test("with format returns formatted Griddata", () => {
    const grid = new Grid<{ hoge: string }>({
      column: {
        items: ["行1", "行2", "行3"],
        showHeader: true,
        headerFormat: { textFormat: { bold: true } },
        pixelSize: 7,
      },
      row: {
        items: ["列1", "列2"],
        showHeader: true,
        headerFormat: [{ textFormat: { fontSize: 1 } }, { textFormat: { fontSize: 2 } }],
      },
      sum: { column: {}, row: { pixelSize: 8 } },
      data: {
        generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}`,
        format: (column, i, row, j) => ({ textDirection: `${column}:${i}/${row}:${j}` }),
      },
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
                  "stringValue": "SUM",
                },
              },
            ],
          },
          Object {
            "values": Array [
              Object {
                "userEnteredValue": Object {
                  "stringValue": "SUM",
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
                "userEnteredFormat": Object {
                  "textDirection": "行1:0/列1:0",
                },
                "userEnteredValue": Object {
                  "stringValue": "fuga:行1:0/列1:0",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textDirection": "行2:1/列1:0",
                },
                "userEnteredValue": Object {
                  "stringValue": "fuga:行2:1/列1:0",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textDirection": "行3:2/列1:0",
                },
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
                "userEnteredFormat": Object {
                  "textDirection": "行1:0/列2:1",
                },
                "userEnteredValue": Object {
                  "stringValue": "fuga:行1:0/列2:1",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textDirection": "行2:1/列2:1",
                },
                "userEnteredValue": Object {
                  "stringValue": "fuga:行2:1/列2:1",
                },
              },
              Object {
                "userEnteredFormat": Object {
                  "textDirection": "行3:2/列2:1",
                },
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
        sheet: "シート",
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.toRange()).toEqual("'シート'!A1:D4");
    });

    test("returns local notation", () => {
      const grid = new Grid<{ hoge: string }>({
        sheet: "シート",
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.toRange({ local: true })).toEqual("A1:D4");
    });
  });

  describe("#toGridRange", () => {
    test("returns grid range", () => {
      const grid = new Grid<{ hoge: string }>({
        sheet: "シート",
        column: { items: ["行1", "行2"], showHeader: true },
        row: { items: ["列1", "列2", "列3"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.toGridRange()).toMatchObject({
        startRowIndex: 0,
        endRowIndex: 5,
        startColumnIndex: 0,
        endColumnIndex: 4,
      });
    });
  });

  describe("#findcolumnTotalHeaderCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2", "行3"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.findcolumnTotalHeaderCell("行2")?.notation).toEqual("C2");
    });
  });

  describe("#findrowTotalCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2", "行3"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.findrowTotalCell("列2")?.notation).toEqual("E4");
    });
  });

  describe("#findDataCell", () => {
    test("returns cell", () => {
      const grid = new Grid<{ hoge: string }>({
        column: { items: ["行1", "行2", "行3"], showHeader: true },
        row: { items: ["列1", "列2"], showHeader: true },
        sum: { column: true, row: true },
        data: { generator: (column, i, row, j, args) => `${args.hoge}:${column}:${i}/${row}:${j}` },
      });

      expect(grid.findDataCell({ column: "行3", row: "列1" })?.notation).toEqual("D3");
    });
  });
});
