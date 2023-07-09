import { logger } from "@mptool/enhance";
import { set } from "@mptool/file";

import { type Cookie, type CookieOptions } from "../../../typings/cookie.js";
import { service } from "../../config/info.js";
import { LoginFailedResponse } from "../../utils/account.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { HOUR } from "../../utils/constant.js";

export interface UnderSystemLoginSuccessResponse {
  status: "success";

  cookies: Cookie[];
}

export type UnderSystemLoginResponse =
  | UnderSystemLoginSuccessResponse
  | LoginFailedResponse;

export const login = (
  options: AccountBasicInfo
): Promise<UnderSystemLoginResponse> =>
  new Promise((resolve, reject) => {
    wx.request<UnderSystemLoginResponse>({
      method: "POST",
      url: `${service}under-system/login`,
      data: options,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          if (data.status === "success") {
            set("under-system-cookie", data.cookies, 6 * HOUR);
          } else logger.error("登录失败", data.msg);
          resolve(data);
        } else reject(`服务器错误: ${statusCode}`);
      },
      fail: ({ errMsg }) => reject(errMsg),
    });
  });

interface UserCourseTableExtraOptions {
  /** 学号 */
  id: number;
  /** 查询时间 */
  time: string;
}

export type UserCourseTableOptions =
  | (AccountBasicInfo | CookieOptions) & UserCourseTableExtraOptions;

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
  status: "success";
  data: TableItem;
  startTime: string;
}

export type UserCourseTableFailedResponse = LoginFailedResponse;

export type UserCourseTableResponse =
  | UserCourseTableSuccessResponse
  | UserCourseTableFailedResponse;

export const getCourseTable = (
  options: UserCourseTableOptions
): Promise<UserCourseTableResponse> =>
  new Promise((resolve, reject) => {
    wx.request<UserCourseTableResponse>({
      method: "POST",
      url: `${service}under-system/course-table`,
      data: options,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed") logger.error("登录失败", data.msg);
        } else reject(`服务器错误: ${statusCode}`);
      },
      fail: ({ errMsg }) => reject(errMsg),
    });
  });

type CourseType =
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

export interface UserGradeListExtraOptions {
  /** 查询时间 */
  time?: string;
  /** 课程名称 */
  name?: string;
  /** 课程性质 */
  courseType?: CourseType;
  gradeType?: "all" | "best";
}

export type UserGradeListOptions = (AccountBasicInfo | CookieOptions) &
  UserGradeListExtraOptions;

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
  status: "success";
  data: GradeResult[];
}

export type UserGradeListFailedResponse = LoginFailedResponse;

export type UserGradeListResponse =
  | UserGradeListSuccessResponse
  | UserGradeListFailedResponse;

export const getGradeList = (
  options: UserGradeListOptions
): Promise<UserGradeListResponse> =>
  new Promise((resolve, reject) => {
    wx.request<UserGradeListResponse>({
      method: "POST",
      url: `${service}under-system/grade-list`,
      data: options,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed") logger.error("登录失败", data.msg);
        } else reject(`服务器错误: ${statusCode}`);
      },
      fail: ({ errMsg }) => reject(errMsg),
    });
  });
