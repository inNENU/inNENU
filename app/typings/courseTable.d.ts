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

export interface CourseTableInfo {
  table: CourseTableData;
  maxWeek: number;
  startTime: string;
}

/** @deprecated */
export interface LegacyCourseTableClassData extends CourseTableClassData {
  teacher: string;
  location: string;
}

/** @deprecated */
// oxlint-disable-next-line typescript/no-deprecated
export type LegacyCourseTableCellData = LegacyCourseTableClassData[];
/** @deprecated */
// oxlint-disable-next-line typescript/no-deprecated
export type LegacyCourseTableRowData = LegacyCourseTableCellData[];
/** @deprecated */
// oxlint-disable-next-line typescript/no-deprecated
export type LegacyCourseTableData = LegacyCourseTableRowData[];

/** @deprecated */
export interface LegacyCourseTableInfo {
  // oxlint-disable-next-line typescript/no-deprecated
  table: LegacyCourseTableData;
  maxWeek: number;
  startTime: string;
}
