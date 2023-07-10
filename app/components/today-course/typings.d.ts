export type WeekRange = [number, number];

export interface ClassData {
  name: string;
  teacher: string;
  time: string;
  location: string;
  weeks: WeekRange[];
}

export type CellData = ClassData[];
export type RowData = CellData[];
export type TableData = RowData[];

export interface CourseTableData {
  courseData: TableData;
  weeks: number;
  startTime: string;
}
