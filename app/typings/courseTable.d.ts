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
export interface LegacyCourseTableClassData extends CourseTableClassData {
  teacher: string;
  location: string;
}

/** @deprecated */
export type LegacyCourseTableCellData = LegacyCourseTableClassData[];
/** @deprecated */
export type LegacyCourseTableRowData = LegacyCourseTableCellData[];
/** @deprecated */
export type LegacyCourseTableData = LegacyCourseTableRowData[];
