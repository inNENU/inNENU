import type {
  CourseTableData,
  LegacyCourseTableData,
} from "../../state/index.js";

export interface CourseTableInfo {
  table: CourseTableData;
  maxWeek: number;
  startTime: string;
}

/** @deprecated */
export interface LegacyCourseTableInfo {
  table: LegacyCourseTableData;
  maxWeek: number;
  startTime: string;
}
