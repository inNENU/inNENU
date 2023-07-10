import { logger } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type Cookie, type CookieOptions } from "../../../typings/cookie.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { UNDER_SYSTEM_COOKIE } from "../../config/keys.js";
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

const getCookie = (
  options: AccountBasicInfo,
): Promise<UnderSystemLoginResponse> =>
  request<UnderSystemLoginResponse>(`${service}under-system/login`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (data.status === "success")
      set(UNDER_SYSTEM_COOKIE, data.cookies, 6 * HOUR);
    else logger.error("登录失败", data.msg);

    return data;
  });

export interface CookieVerifySuccessResponse {
  status: "success";
  valid: boolean;
}

export type CookieVerifyResponse =
  | CookieVerifySuccessResponse
  | CommonFailedResponse;

export const check = (cookies: Cookie[]): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}under-system/check`, {
    method: "POST",
    data: { cookies },
  });

export const login = (
  account: AccountBasicInfo,
): Promise<UnderSystemLoginResponse> => {
  const cookies = get<Cookie[]>(UNDER_SYSTEM_COOKIE);

  return cookies
    ? check(cookies).then((valid) =>
        valid ? { status: "success", cookies } : getCookie(account),
      )
    : getCookie(account);
};

interface UserCourseTableExtraOptions {
  /** 学号 */
  id: number;
  /** 查询时间 */
  time: string;
}

export type UserCourseTableOptions = (AccountBasicInfo | CookieOptions) &
  UserCourseTableExtraOptions;

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
  options: UserCourseTableOptions,
): Promise<UserCourseTableResponse> =>
  request<UserCourseTableResponse>(`${service}under-system/course-table`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (data.status === "failed") logger.error("获取失败", data.msg);

    return data;
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
  options: UserGradeListOptions,
): Promise<UserGradeListResponse> =>
  request<UserGradeListResponse>(`${service}under-system/grade-list`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (data.status === "failed") logger.error("获取失败", data.msg);

    return data;
  });
