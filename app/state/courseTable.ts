export interface CourseTableClassData {
  name: string;
  teachers: string[];
  time: string;
  weeks: number[];
  locations: string[];
  classIndex: [number, number];
}

export type CourseTableCellData = CourseTableClassData[];
export type CourseTableRowData = CourseTableCellData[];
export type CourseTableData = CourseTableRowData[];

/** @deprecated */
export interface OldCourseTableClassData {
  name: string;
  teacher: string;
  time: string;
  location: string;
}

/** @deprecated */
export type OldCourseTableCellData = OldCourseTableClassData[];
/** @deprecated */
export type OldCourseTableRowData = OldCourseTableCellData[];
/** @deprecated */
export type OldCourseTableData = OldCourseTableRowData[];
