import { logger } from "@mptool/enhance";

import { type Cookie } from "../../../typings/cookie.js";
import { LoginFailedResponse } from "../../utils/account.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { service } from "../../utils/config.js";

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
          resolve(data);
          if (data.status === "failed") logger.error("登录失败", data.msg);
        } else reject();
      },
      fail: () => reject(),
    });
  });

interface UnderCourseTableAuthOptions extends AccountBasicInfo {
  /** 查询时间 */
  time: string;
}

interface UnderCourseTableCookieOptions {
  cookies: Cookie[];
  id: number;
  time: string;
}

export type UserCourseTableOptions =
  | UnderCourseTableAuthOptions
  | UnderCourseTableCookieOptions;

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
}

export type UserCourseTableFailedResponse = LoginFailedResponse;

export type UserCourseTableResponse =
  | UserCourseTableSuccessResponse
  | UserCourseTableFailedResponse;

export const getCourseTable = (
  options: UnderCourseTableAuthOptions
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
        } else reject();
      },
      fail: () => reject(),
    });
  });
