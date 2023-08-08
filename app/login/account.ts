import { logger } from "@mptool/all";

import { LoginFailType } from "./loginFailTypes.js";
import type { AuthLoginResponse } from "./typings.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { request } from "../api/net.js";
import { service } from "../config/index.js";
import type { AccountBasicInfo } from "../utils/app.js";

export const AUTH_SERVER = "https://authserver.nenu.edu.cn";
export const WEB_VPN_AUTH_SERVER = "https://authserver-443.webvpn.nenu.edu.cn";

export interface AuthInitInfoResponse {
  success: true;
  needCaptcha: boolean;
  captcha: string;
  params: Record<string, string>;
  salt: string;
}

export const getAuthInit = async (
  id: string,
): Promise<AuthInitInfoResponse | CommonFailedResponse> => {
  const result = await request<AuthInitInfoResponse | CommonFailedResponse>(
    `${service}auth/init?id=${id}`,
    { scope: AUTH_SERVER },
  );

  if (!result.success) logger.error("初始化失败");

  return result;
};

export interface AuthInitOptions extends AccountBasicInfo {
  params: Record<string, string>;
  salt: string;
  captcha: string;
}

export interface AuthInfo {
  /** 用户姓名 */
  name: string;

  /** 登陆别名 */
  alias: string;
}

export interface AuthInitSuccessResponse {
  success: true;

  info: AuthInfo | null;
}

export interface AuthInitFailedResponse extends CommonFailedResponse {
  type: LoginFailType;
}

export type AuthInitResponse = AuthInitSuccessResponse | AuthInitFailedResponse;

export const authInit = async (
  data: AuthInitOptions,
): Promise<AuthInitResponse> => {
  const result = await request<AuthInitResponse>(`${service}auth/init`, {
    method: "POST",
    data,
    scope: AUTH_SERVER,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const authLogin = async ({
  id,
  password,
}: AccountBasicInfo): Promise<AuthLoginResponse> => {
  const data = await request<AuthLoginResponse>(`${service}auth/login`, {
    method: "POST",
    data: { id, password },
    scope: AUTH_SERVER,
  });

  if (!data.success)
    logger.error("登陆失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};
