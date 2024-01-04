import { logger } from "@mptool/all";

import { AUTH_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { LoginFailType } from "../loginFailTypes.js";

export interface AuthLoginSuccessResponse {
  success: true;
  location: string;
}

export interface AuthLoginFailedResponse extends CommonFailedResponse {
  type: Exclude<LoginFailType, LoginFailType.WrongCaptcha>;
}

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
  | AuthLoginFailedResponse;

export const authLogin = async ({
  id,
  password,
}: AccountInfo): Promise<AuthLoginResponse> => {
  const { data } = await request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: { id, password },
    cookieScope: AUTH_SERVER,
  });

  if (!data.success)
    logger.error("登录失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};
