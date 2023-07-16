import { type CommonFailedResponse } from "../../../typings/response.js";
import { type LoginFailedResponse } from "../../api/index.js";

export interface UserCourseTableOptions {
  /** 查询时间 */
  time: string;
}

export interface ClassItem {
  name: string;
  teacher: string;
  time: string;
  location: string;
}

export type CellItem = ClassItem[];
export type RowItem = CellItem[];
export type TableItem = RowItem[];

export interface UserCourseTableSuccessResponse {
  success: true;
  data: TableItem;
  startTime: string;
}

export type UserCourseTableFailedResponse = LoginFailedResponse;

export type UserCourseTableResponse =
  | UserCourseTableSuccessResponse
  | UserCourseTableFailedResponse;

export type CourseType =
  | "通识教育必修课"
  | "通识教育选修课"
  | "专业教育必修课"
  | "专业教育选修课"
  | "教师职业教育必修课"
  | "教师职业教育选修课"
  | "任意选修课"
  | "发展方向课"
  | "教师教育必修课"
  | "教师教育选修课";

export interface UserGradeListOptions {
  /** 查询时间 */
  time?: string;
  /** 课程名称 */
  name?: string;
  /** 课程性质 */
  courseType?: CourseType | "";
  gradeType?: "all" | "best";
}

export interface ScoreDetail {
  score: number;
  percent: number;
}

export interface GradeDetail {
  usual: ScoreDetail[];
  exam: ScoreDetail | null;
}

export interface GradeResult {
  /** 修读时间 */
  time: string;
  /** 课程 id */
  cid: string;
  /** 课程名称 */
  name: string;
  /** 难度系数 */
  difficulty: number;
  /** 分数 */
  grade: number;
  /** 分数详情 */
  gradeDetail: GradeDetail | null;
  /** 绩点成绩 */
  gradePoint: number;
  /** 成绩标志 */
  mark: string;
  /** 课程类型 */
  courseType: string;
  /** 选修课类型 */
  commonType: string;
  /** 课程类型短称 */
  shortCourseType: string;
  /** 学时 */
  hours: number | null;
  /** 学分 */
  point: number;
  /** 考试性质 */
  examType: string;
  /** 补重学期 */
  reLearn: string;
  /** 审核状态 */
  status: string;
}

export interface UserGradeListSuccessResponse {
  success: true;
  data: GradeResult[];
}

export type UserGradeListFailedResponse = LoginFailedResponse;

export type UserGradeListResponse =
  | UserGradeListSuccessResponse
  | UserGradeListFailedResponse
  | CommonFailedResponse;
