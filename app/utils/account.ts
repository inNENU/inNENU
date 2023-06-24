import { logger } from "@mptool/enhance";
import { set } from "@mptool/file";

import { type AccountBasicInfo } from "./app.js";
import { service } from "./config.js";
import { WEEK } from "./constant.js";
import { Cookie } from "../../typings/index.js";

export interface LoginSuccessResponse {
  status: "success";
  cookies: Cookie[];
}

export interface LoginFailedResponse {
  status: "failed";
  msg: string;
}

export type LoginResponse = LoginSuccessResponse | LoginFailedResponse;

export const login = ({
  id,
  password,
}: AccountBasicInfo): Promise<LoginResponse> =>
  new Promise((resolve, reject) => {
    wx.request<LoginResponse>({
      method: "POST",
      url: `${service}auth/login`,
      data: { id, password },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          if (data.status === "success") set("cookies", data.cookies, WEEK);
          resolve(data);
        } else {
          logger.error("auth login service failed with", statusCode);
          reject();
        }
      },
      fail: () => reject(),
    });
  });

export interface InfoSuccessResponse {
  status: "success";

  /** 用户姓名 */
  name: string;

  /** 用户邮箱 */
  email: string;
}

export interface InfoFailedResponse {
  status: "failed";
  msg: string;
}

export type InfoResponse = InfoSuccessResponse | InfoFailedResponse;

export const getInfo = (cookies: Cookie[]): Promise<InfoResponse> =>
  new Promise((resolve, reject) => {
    wx.request<InfoResponse>({
      method: "POST",
      url: `${service}auth/info`,
      data: { cookies },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
        } else {
          logger.error("auth info service failed with", statusCode);
          reject();
        }
      },
      fail: () => reject(),
    });
  });
