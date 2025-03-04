import type {
  CourseTableData,
  LegacyCourseTableData,
} from "../../typings/index.js";

export interface CourseTableInfo {
  table: CourseTableData;
  maxWeek: number;
  startTime: string;
}

/** @deprecated */
export interface LegacyCourseTableInfo {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  table: LegacyCourseTableData;
  maxWeek: number;
  startTime: string;
}
