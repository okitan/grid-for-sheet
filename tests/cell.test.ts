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
});
