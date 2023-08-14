import { logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { AUTH_SERVER } from "../../login/account.js";
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
  const result = await request<AuthInitInfoResponse | CommonFailedResponse>(
    `${service}auth/init?id=${id}`,
    { scope: AUTH_SERVER },
  );

  if (!result.success) logger.error("初始化失败");

  return result;
};

export interface AuthInitOptions extends AccountInfo {
  params: Record<string, string>;
  salt: string;
  captcha: string;
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
