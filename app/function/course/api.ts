import { logger } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import {
  type UnderSystemLoginResponse,
  type UserCourseTableOptions,
  type UserCourseTableResponse,
  type UserGradeListOptions,
  type UserGradeListResponse,
} from "./typings.js";
import {
  type Cookie,
  type CookieVerifyResponse,
} from "../../../typings/index.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { UNDER_SYSTEM_COOKIE } from "../../config/keys.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { HOUR } from "../../utils/constant.js";

export const getCourseCookie = (
  options: AccountBasicInfo,
): Promise<UnderSystemLoginResponse> =>
  request<UnderSystemLoginResponse>(`${service}under-system/login`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (data.success) set(UNDER_SYSTEM_COOKIE, data.cookies, 6 * HOUR);
    else logger.error("登录失败", data.msg);

    return data;
  });

export const checkCourseCookie = (
  cookies: Cookie[],
): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}under-system/check`, {
    method: "POST",
    data: { cookies },
  });

export const courseLogin = (
  account: AccountBasicInfo,
): Promise<UnderSystemLoginResponse> => {
  const cookies = get<Cookie[]>(UNDER_SYSTEM_COOKIE);

  return cookies
    ? checkCourseCookie(cookies).then((valid) =>
        valid ? { success: true, cookies } : getCourseCookie(account),
      )
    : getCourseCookie(account);
};

export const getCourseTable = (
  options: UserCourseTableOptions,
): Promise<UserCourseTableResponse> =>
  request<UserCourseTableResponse>(`${service}under-system/course-table`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getGradeList = (
  options: UserGradeListOptions,
): Promise<UserGradeListResponse> =>
  request<UserGradeListResponse>(`${service}under-system/grade-list`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
