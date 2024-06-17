import type {
  ActionFailType,
  CommonFailedResponse,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";

export interface SelectLoginSuccessResponse {
  success: true;
  server: string;
}

type SelectLoginResponse = SelectLoginSuccessResponse | CommonFailedResponse;

export interface CourseData {
  /** 课程名称 */
  name: string;
  /** 课程 ID */
  cid: string;
}

export interface CourseInfo {
  /** 名称 */
  name: string;
  /** 开课单位 */
  office: string;
  /** 类别 */
  type: string;
  /** 学分 */
  point: number;
  /** 容量 */
  capacity: number;
  /** 任课教师 */
  teacher: string;
  /** 上课周次 */
  week: string;
  /** 上课时间 */
  time: string;
  /** 上课地点 */
  place: string;
  /** 课 ID */
  cid: string;
  /** 课程 ID */
  id: string;

  /** 考试时间 */
  examTime: string;
  /** 周次类型 */
  weekType: string;
  /** 班级名称 */
  className: string;
}

export interface MajorInfo {
  /** 名称 */
  name: string;
  /** 编号 */
  id: string;
}

export interface StudentInfo {
  /** 当前学期 */
  period: string;
  /** 阶段 */
  stage: string;
  /** 姓名 */
  name: string;
  /** 学号 */
  id: string;
  /** 年级 */
  grade: string;
  /** 专业名 */
  majorName: string;
}

export interface SelectInfoOptions {
  server: string;
  type: "under" | "grad";
}

export interface SelectInfoSuccessResponse {
  success: true;
  jx0502id: string;
  jx0502zbid: string;

  /** 课程信息 */
  courses: CourseInfo[];
  /** 课程类别 */
  courseTypes: string[];
  /** 开课单位 */
  courseOffices: string[];
  /** 年级 */
  grades: string[];
  /** 专业 */
  majors: MajorInfo[];

  /** 当前校区 */
  currentLocation: "本部" | "净月";
  /** 当前专业 */
  currentMajor: string;
  /** 当前年级 */
  currentGrade: string;
  /** 课程表 */
  courseTable: CourseData[][][];
  /** 学生信息 */
  info: StudentInfo;
}

export type SelectInfoResponse =
  | SelectInfoSuccessResponse
  | CommonFailedResponse;

export interface ProcessOptions {
  server: string;
  /** 课程号 */
  courseId: string;
  jx0502id: string;
  jx0502zbid: string;
}

export interface ProcessSuccessResponse {
  success: true;
  msg: string;
}

export type ProcessFailedResponse = CommonFailedResponse<
  ActionFailType.Expired | ActionFailType.Conflict | ActionFailType.Forbidden
>;

export type ProcessResponse = ProcessSuccessResponse | ProcessFailedResponse;

export interface SearchOptions {
  server: string;

  /** 年级 */
  grade?: string;
  /** 专业 */
  major?: string;
  /** 课程类型 */
  courseType?: string;
  /** 课程名称 */
  courseName?: string;
  /** 开课单位 */
  office?: string;
  /** 周次 */
  week?: string;
  /** 节次 */
  index?: string;
  jx0502id: string;
}

export interface CourseBasicInfo {
  /** 课程号 */
  id: string;
  /** 课程名称 */
  name: string;
  /** 开课单位 */
  office: string;
  /** 课程类型 */
  type: string;
}

export interface SelectSearchSuccessResponse {
  success: true;
  /** 课程信息 */
  courses: CourseBasicInfo[];
}

export type SelectSearchFailedResponse =
  CommonFailedResponse<ActionFailType.Expired>;

export type SelectSearchResponse =
  | SelectSearchSuccessResponse
  | SelectSearchFailedResponse;

export interface StudentAmountOptions extends Partial<AccountInfo> {
  server: string;
  /** 课程号 */
  courseId: string;
  jx0502id: string;
}

export interface StudentAmountRaw {
  jx0404id: string;
  rs: number;
}

export interface StudentAmountData {
  /** 课程号 */
  cid: string;
  /** 选课人数 */
  amount: number;
}

export interface StudentAmountSuccessResponse {
  success: true;
  data: StudentAmountData[];
}

export type StudentAmountFailedResponse =
  CommonFailedResponse<ActionFailType.Expired>;

export type StudentAmountResponse =
  | StudentAmountSuccessResponse
  | StudentAmountFailedResponse;
