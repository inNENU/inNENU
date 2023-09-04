import type { CommonFailedResponse } from "../../../typings/response.js";
import type {
  AuthLoginFailedResponse,
  LoginFailType,
  VPNLoginFailedResponse,
} from "../../login/index.js";

export interface ChangeMajorPlan {
  /** 学院 */
  school: string;
  /** 专业 */
  major: string;
  /** 科类 */
  subject: string;
  /** 考试类型 */
  examType: string;
  /** 考试时间 */
  time: string;
  /** 考试地点 */
  location: string;
  /** 计划数 */
  plan: number;
  /** 当前报名人数 */
  current: number;
  /** 准入要求 */
  requirement: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
}

export interface UnderChangeMajorPlanSuccessResponse {
  success: true;
  /** 计划标题 */
  header: string;
  /** 计划 */
  plans: ChangeMajorPlan[];
}

export type UnderChangeMajorPlanFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export type UnderChangeMajorPlanResponse =
  | UnderChangeMajorPlanSuccessResponse
  | UnderChangeMajorPlanFailedResponse;

export interface ExamPlace {
  /** 课程 */
  course: string;
  /** 时间 */
  time: string;
  /** 校区 */
  campus: string;
  /** 教学楼 */
  building: string;
  /** 考场 */
  classroom: string;
}

export interface UnderExamPlaceSuccessResponse {
  success: true;

  /** 计划 */
  data: {
    name: string;
    exams: ExamPlace[];
  }[];
}

export type UnderExamPlaceFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export type UnderExamPlaceResponse =
  | UnderExamPlaceSuccessResponse
  | UnderExamPlaceFailedResponse;

export interface UnderCourseTableOptions {
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

export interface UnderCourseTableSuccessResponse {
  success: true;
  data: TableItem;
  startTime: string;
}

export type UnderCourseTableFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export type UnderCourseTableResponse =
  | UnderCourseTableSuccessResponse
  | UnderCourseTableFailedResponse;

export interface PostCourseTableOptions {
  /** 查询时间 */
  time: string;
}

export interface PostCourseTableSuccessResponse {
  success: true;
  data: TableItem;
  startTime: string;
}

export type PostCourseTableFailedResponse =
  | AuthLoginFailedResponse
  | (CommonFailedResponse & { type: LoginFailType.Expired });

export type PostCourseTableResponse =
  | PostCourseTableSuccessResponse
  | PostCourseTableFailedResponse;

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

export type UnderGradeListFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | (CommonFailedResponse & { type: LoginFailType.Expired })
  | (CommonFailedResponse & { type: "error" });

export type UnderGradeListResponse =
  | UnderGradeListSuccessResponse
  | UnderGradeListFailedResponse;

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
  | AuthLoginFailedResponse
  | (CommonFailedResponse & { type: LoginFailType.Expired })
  | (CommonFailedResponse & { type: "error" });

export type PostGradeListResponse =
  | PostGradeListSuccessResponse
  | PostGradeListFailedResponse;
