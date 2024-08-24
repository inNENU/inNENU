import type { CourseTableData } from "../../state/index.js";

export interface CourseTableInfo {
  table: CourseTableData;
  maxWeek: number;
  startTime: string;
}

/** @deprecated */
export type OldWeekRange = [number, number];

/** @deprecated */
export interface OldClassData {
  name: string;
  teacher: string;
  time: string;
  location: string;
  weeks: OldWeekRange[];
}

/** @deprecated */
export type OldCellData = OldClassData[];
/** @deprecated */
export type OldRowData = OldCellData[];
/** @deprecated */
export type OldTableData = OldRowData[];

/** @deprecated */
export interface OldCourseTableInfo {
  courseData: OldTableData;
  weeks: number;
  startTime: string;
}
