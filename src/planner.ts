import { Grid, type GridConstructor } from "./grid";

export function createRightGrid<T = {}, C = string, R = string>(
  from: Grid<any, any, any>,
  { margin = 0, ...args }: { margin?: number } & GridConstructor<T, C, R>
) {
  return new Grid({
    sheet: from.sheet,
    startColumn: from.startColumn + from.columnLength + margin,
    startRow: from.startRow,
    ...args,
  });
}

export function createLowerGrid<T = {}, C = string, R = string>(
  from: Grid<any, any, any>,
  { margin = 0, ...args }: { margin?: number } & GridConstructor<T, C, R>
) {
  return new Grid({
    sheet: from.sheet,
    startColumn: from.startColumn,
    startRow: from.startRow + from.rowLength + margin,
    ...args,
  });
}
