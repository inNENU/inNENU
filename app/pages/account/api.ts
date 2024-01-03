import { logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/index.js";
import { AUTH_SERVER } from "../../login/index.js";
import { LoginFailType } from "../../login/loginFailTypes.js";
import { AccountInfo, UserInfo } from "../../utils/typings.js";

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
  const { data: result } = await request<
    AuthInitInfoResponse | CommonFailedResponse
  >(`/auth/init?id=${id}`, { cookieScope: AUTH_SERVER });

  if (!result.success) logger.error("初始化失败");

  return result;
};

export interface AuthInitOptions extends AccountInfo {
  params: Record<string, string>;
  salt: string;
  captcha: string;
  openid: string;
}

export interface AuthInitSuccessResponse {
  success: true;

  info: UserInfo | null;
}

export interface AuthInitFailedResponse extends CommonFailedResponse {
  type: LoginFailType;
}

export type AuthInitResponse = AuthInitSuccessResponse | AuthInitFailedResponse;

export const authInit = async (
  options: AuthInitOptions,
): Promise<AuthInitResponse> => {
  const { data: result } = await request<AuthInitResponse>("/auth/init", {
    method: "POST",
    body: options,
    cookieScope: AUTH_SERVER,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};
