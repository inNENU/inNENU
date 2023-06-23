import { logger } from "@mptool/enhance";

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

export interface SelectBaseSuccessResponse {
  status: "success";
}

export interface SelectBaseFailedResponse {
  status: "failed";
  /** 错误信息 */
  msg: string;
}

export interface SelectLoginOptions {
  /** 学号 */
  id: number;
  /** 密码 */
  password: string;
}

export type SelectLoginSuccessResponse = SelectBaseOptions &
  SelectBaseSuccessResponse;

export type SelectLoginFailedResponse = SelectBaseFailedResponse;

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
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("登录失败", options, data.msg);
        } else reject();
      },
      fail: () => reject(),
    });
  });

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

export interface SelectInfoSuccessResponse extends SelectBaseSuccessResponse {
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

  /** 当前专业 */
  currentMajor: string;
  /** 当前年级 */
  currentGrade: string;
  /** 课程表 */
  courseTable: CourseData[][][];
}

export type SelectInfoFailedResponse = SelectBaseFailedResponse;

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
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("获取信息失败", options, data.msg);
        } else reject();
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

export interface ProcessSuccessResponse extends SelectBaseSuccessResponse {
  msg: string;
}

export interface ProcessFailedResponse extends SelectBaseFailedResponse {
  type?: "conflict" | "relogin" | "forbid";
}

export type ProcessResponse = ProcessSuccessResponse | ProcessFailedResponse;

export const process = (
  type: "add" | "delete",
  { cookies, server, id, jx0502id, jx0502zbid }: ProcessOptions
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    const params = Object.entries({
      jx0502id,
      jx0502zbid,
      jx0404id: id,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    wx.request<{ msgContent: string }>({
      method: "POST",
      url: `${server}xk/process${type === "delete" ? "Tx" : "Xk"}`,
      header: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies.join(", "),
      },
      data: params,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          try {
            const { msgContent: msg } = data;

            if (msg === "系统更新了选课数据,请重新登录系统")
              return resolve(<ProcessFailedResponse>{
                status: "failed",
                msg,
                type: "relogin",
              });

            if (msg === "您的账号在其它地方登录")
              return resolve(<ProcessFailedResponse>{
                status: "failed",
                msg,
                type: "relogin",
              });

            if (type === "delete") {
              if (msg.includes("退选成功"))
                return resolve(<ProcessSuccessResponse>{
                  status: "success",
                  msg,
                });
            } else {
              if (msg.endsWith("上课时间冲突"))
                return resolve({
                  status: "failed",
                  msg,
                  type: "conflict",
                });

              if (msg.includes("选课成功"))
                return resolve(<ProcessSuccessResponse>{
                  status: "success",
                  msg,
                });
            }

            return resolve(<ProcessFailedResponse>{
              status: "failed",
              msg,
            });
          } catch (err) {
            console.error(err);
          }
        }

        resolve(<ProcessFailedResponse>{
          status: "failed",
          msg: "参数有误",
        });
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

export interface SelectSearchSuccessResponse extends SelectBaseSuccessResponse {
  /** 课程信息 */
  courses: CourseBasicInfo[];
}

export interface SelectSearchFailedResponse extends SelectBaseFailedResponse {
  type?: "relogin";
}

export type SelectSearchResponse =
  | SelectSearchSuccessResponse
  | SelectSearchFailedResponse;

export const search = (options: SearchOptions): Promise<SelectSearchResponse> =>
  new Promise((resolve, reject) => {
    wx.request<SelectSearchResponse>({
      method: "POST",
      url: `${service}select/search`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("搜索课程失败", options, data.msg);
        } else reject();
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
  cid: string;
  /** 选课人数 */
  amount: number;
}

export interface StudentAmountSuccessResponse
  extends SelectBaseSuccessResponse {
  data: StudentAmountData[];
}

export interface StudentAmountFailedResponse extends SelectBaseFailedResponse {
  type?: "relogin";
}

export type StudentAmountResponse =
  | StudentAmountSuccessResponse
  | StudentAmountFailedResponse;

export const getAmount = (
  options: StudentAmountOptions
): Promise<StudentAmountResponse> =>
  new Promise((resolve, reject) => {
    wx.request<StudentAmountResponse>({
      method: "POST",
      url: `${service}select/student-amount`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("获取选课人数失败", options, data.msg);
        } else reject();
      },
      fail: () => reject(),
    });
  });