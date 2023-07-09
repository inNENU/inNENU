import { logger } from "@mptool/enhance";
import { set } from "@mptool/file";

import { type AccountBasicInfo } from "./app.js";
import { WEEK } from "./constant.js";
import { CommonFailedResponse, Cookie } from "../../typings/index.js";
import { service } from "../config/info.js";

export interface LoginSuccessResponse {
  status: "success";
  cookies: Cookie[];
}

export interface LoginFailedResponse extends CommonFailedResponse {
  type: "captcha" | "wrong" | "unknown";
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
      enableHttp2: true,
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

export type InfoResponse = InfoSuccessResponse | CommonFailedResponse;

export const getInfo = (cookies: Cookie[]): Promise<InfoResponse> =>
  new Promise((resolve, reject) => {
    wx.request<InfoResponse>({
      method: "POST",
      url: `${service}auth/info`,
      data: { cookies },
      enableHttp2: true,
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
