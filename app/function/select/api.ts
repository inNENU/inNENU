import { service } from "../../utils/config.js";

export interface SelectBaseOptions {
  /**
   * Cookie
   */
  cookies: string[];
  /**
   * 服务器地址
   */
  server: string;
}

export interface SelectLoginSuccessResponse {
  status: "success";
  cookie: string;
  server: string;
}

export interface SelectLoginOptions {
  id: number;
  password: string;
}

export interface SelectLoginSuccessResponse {
  status: "success";
  cookies: string[];
  server: string;
}

export interface SelectLoginFailedResponse {
  status: "failed";
  msg: string;
}

type SelectLoginResponse =
  | SelectLoginSuccessResponse
  | SelectLoginFailedResponse;

export const login = (
  options: SelectLoginOptions
): Promise<SelectLoginResponse> =>
  new Promise((resolve, reject) => {
    wx.request<SelectLoginResponse>({
      method: "POST",
      url: `${service}select/login`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) resolve(data);
        else reject();
      },
      fail: () => reject(),
    });
  });

export interface CourseData {
  id: string;
  name: string;
}

export interface CourseInfo {
  /** 名称 */
  name: string;
  /** 开课单位 */
  office: string;
  /** 类别 */
  type: string;
  /** 学分 */
  point: string;
  /** 容量 */
  capacity: string;
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

export interface SelectInfoSuccessResponse {
  status: "success";
  jx0502id: string;
  jx0502zbid: string;
  courses: CourseInfo[];
  courseTable: CourseData[][][];
  courseTypes: string[];
  courseOffices: string[];
  currentMajor: string;
  currentGrade: string;
  grades: string[];
  majors: MajorInfo[];
}

export interface SelectInfoFailedResponse {
  status: "failed";
  msg: string;
}

export type SelectInfoResponse =
  | SelectInfoSuccessResponse
  | SelectInfoFailedResponse;

export const getInfo = (
  options: SelectBaseOptions
): Promise<SelectInfoResponse> =>
  new Promise((resolve, reject) => {
    wx.request<SelectInfoResponse>({
      method: "POST",
      url: `${service}select/info`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) resolve(data);
        else reject();
      },
      fail: () => reject(),
    });
  });

export interface ProcessOptions extends SelectBaseOptions {
  /** 课程号 */
  id: string;
  jx0502id: string;
  jx0502zbid: string;
}

export interface ProcessSuccessResponse {
  status: "success";
  msg: string;
}

export interface ProcessFailedResponse {
  status: "failed";
  msg: string;
  type?: "conflict" | "relogin";
}

export type ProcessResponse = ProcessSuccessResponse | ProcessFailedResponse;

export const process = (
  type: "add" | "delete",
  options: ProcessOptions
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    wx.request<ProcessResponse>({
      method: type === "delete" ? "DELETE" : "PUT",
      url: `${service}select/process`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) resolve(data);
        else reject();
      },
      fail: () => reject(),
    });
  });

export interface SearchOptions extends SelectBaseOptions {
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
  /** 周几 */
  week?: string;
  /** 节次 */
  index?: number;
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

export interface SearchSuccessResponse {
  status: "success";
  courses: CourseBasicInfo[];
}

export interface SearchFailedResponse {
  status: "failed";
  msg: string;
}

export type SearchResponse = SearchSuccessResponse | SearchFailedResponse;

export const search = (options: SearchOptions): Promise<SearchResponse> =>
  new Promise((resolve, reject) => {
    wx.request<SearchResponse>({
      method: "POST",
      url: `${service}select/search`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) resolve(data);
        else reject();
      },
      fail: () => reject(),
    });
  });

export interface StudentAmountOptions extends SelectBaseOptions {
  /** 课程号 */
  id: string;
  jx0502id: string;
}

export interface StudentAmountData {
  /** 课程号 */
  id: string;
  /** 选课人数 */
  amount: number;
}

export interface StudentAmountSuccessResponse {
  status: "success";
  data: StudentAmountData[];
}

export interface StudentAmountFailedResponse {
  status: "failed";
  msg: string;
}

export type StudentAmountResponse =
  | StudentAmountSuccessResponse
  | StudentAmountFailedResponse;

export const getAmount = (
  options: SearchOptions
): Promise<StudentAmountResponse> =>
  new Promise((resolve, reject) => {
    wx.request<StudentAmountResponse>({
      method: "POST",
      url: `${service}select/search`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) resolve(data);
        else reject();
      },
      fail: () => reject(),
    });
  });
