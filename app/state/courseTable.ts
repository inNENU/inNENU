export interface CourseTableClassData {
  name: string;
  teacher: string;
  time: string;
  location: string;
}

export type CourseTableCellData = CourseTableClassData[];
export type CourseTableRowData = CourseTableCellData[];
export type CourseTableData = CourseTableRowData[];
