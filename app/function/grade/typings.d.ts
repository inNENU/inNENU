import type { CommonFailedResponse } from "../../../typings/index.js";
import type { LoginFailType } from "../../login/index.js";

export interface ScoreDetail {
  score: number;
  percent: number;
}

export interface GradeDetail {
  usual: ScoreDetail[];
  exam: ScoreDetail | null;
}

export interface UnderGradeResult {
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
  /** 分数文本 */
  gradeText: string | null;
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

export interface UnderGradeListSuccessResponse {
  success: true;
  data: UnderGradeResult[];
}

export type UnderGradeListFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired | "error";
};

export type UnderGradeListResponse =
  | UnderGradeListSuccessResponse
  | UnderGradeListFailedResponse;

export type UnderCourseType =
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

export interface UnderGradeListOptions {
  /** 查询时间 */
  time?: string;
  /** 课程名称 */
  name?: string;
  /** 课程性质 */
  courseType?: UnderCourseType | "";
  gradeType?: "all" | "best";
}

export interface PostGradeResult {
  /** 修读时间 */
  time: string;
  /** 课程名称 */
  name: string;
  /** 分数 */
  grade: number;
  /** 分数文本 */
  gradeText: string | null;
  /** 绩点成绩 */
  gradePoint: number;
  /** 成绩标志 */
  mark: string;
  /** 课程性质 */
  courseCategory: string;
  /** 课程类型 */
  courseType: string;
  /** 学时 */
  hours: number | null;
  /** 学分 */
  point: number;
  /** 考试性质 */
  examType: string;
  /** 补重学期 */
  reLearn: string;
}

export interface PostGradeListSuccessResponse {
  success: true;
  data: PostGradeResult[];
}

export type PostGradeListFailedResponse =
  | (CommonFailedResponse & { type: LoginFailType.Expired })
  | (CommonFailedResponse & { type: "error" });

export type PostGradeListResponse =
  | PostGradeListSuccessResponse
  | PostGradeListFailedResponse;
