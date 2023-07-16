import { logger } from "@mptool/all";

import { type CommonFailedResponse } from "../../../typings/index.js";
import { service } from "../../config/index.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { request } from "../net.js";

export const AUTH_SERVER = "https://authserver.nenu.edu.cn";
export const WEB_VPN_AUTH_SERVER = "https://authserver-443.webvpn.nenu.edu.cn";

export interface LoginSuccessResponse {
  success: true;
}

export interface LoginFailedResponse extends CommonFailedResponse {
  type: "captcha" | "wrong" | "unknown";
}

export type LoginResponse = LoginSuccessResponse | LoginFailedResponse;

export const login = async ({
  id,
  password,
}: AccountBasicInfo): Promise<LoginResponse> => {
  const data = await request<LoginResponse>(`${service}auth/login`, {
    method: "POST",
    data: { id, password },
    scope: AUTH_SERVER,
  });

  if (!data.success) logger.error("登陆失败", data.msg);

  return data;
};

export interface InfoSuccessResponse {
  success: true;

  /** 用户姓名 */
  name: string;

  /** 用户邮箱 */
  email: string;
}

export type InfoResponse = InfoSuccessResponse | CommonFailedResponse;

export const getInfo = async (): Promise<InfoResponse> => {
  const data = await request<InfoResponse>(`${service}auth/info`, {
    method: "POST",
    scope: `${AUTH_SERVER}/authserver/`,
  });

  if (!data.success) logger.error("获取信息失败", data.msg);

  return data;
};
