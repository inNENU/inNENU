import type { CommonFailedResponse } from "../../../typings/response.js";
import type { LoginFailType } from "../../login/index.js";

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

export type UnderChangeMajorPlanFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

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

export type UnderExamPlaceFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

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

export type UnderCourseTableFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

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

export type PostCourseTableFailedResponse = CommonFailedResponse & {
  type: LoginFailType.Expired;
};

export type PostCourseTableResponse =
  | PostCourseTableSuccessResponse
  | PostCourseTableFailedResponse;
