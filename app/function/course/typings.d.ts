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

export type UnderGradeListFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired | "error";
};

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
  | (CommonFailedResponse & { type: LoginFailType.Expired })
  | (CommonFailedResponse & { type: "error" });

export type PostGradeListResponse =
  | PostGradeListSuccessResponse
  | PostGradeListFailedResponse;

export interface UnderBasicInfo {
  text: string;
  value: string;
}

export interface UnderStudyInfo {
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 地点 */
  school: string;
  /** 职务 */
  title: string;
  /** 证明人 */
  witness: string;
  /** 备注 */
  remark: string;
}

export interface UnderFamilyInfo {
  /** 姓名 */
  name: string;
  /** 与本人关系 */
  relation: string;
  /** 工作单位 */
  office: string;
  /** 职务 */
  title: string;
  /** 联系电话 */
  phone: string;
  /** 备注 */
  remark: string;
}

export interface UnderStudentArchiveInfo {
  /** 学籍照片 */
  archiveImage: string;
  /** 高考照片 */
  examImage: string;
  /** 基础信息 */
  basic: UnderBasicInfo[];
  /** 学习经历信息 */
  study: UnderStudyInfo[];
  /** 家庭信息 */
  family: UnderFamilyInfo[];
  /** 是否能注册 */
  canRegister: boolean;
  /** 是否已注册 */
  isRegistered: boolean;
  /** 注册路径 */
  path: string;
}

export interface GetUnderStudentArchiveOptions {
  type?: "get";
}

export interface UnderGetStudentArchiveSuccessResponse {
  success: true;
  info: UnderStudentArchiveInfo;
}

export type UnderGetStudentArchiveResponse =
  | UnderGetStudentArchiveSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export interface RegisterUnderStudentArchiveOptions {
  type?: "register";
  idCard: string;
}

export interface UnderRegisterStudentArchiveSuccessResponse {
  success: true;
}

export type UnderRegisterStudentArchiveResponse =
  | UnderRegisterStudentArchiveSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });
