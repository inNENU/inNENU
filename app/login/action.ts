import { logger } from "@mptool/all";

import { handleFailResponse } from "./account.js";
import type {
  ActionLoginResponse,
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/response.js";
import { request } from "../api/net.js";
import { service } from "../config/index.js";
import type { LoginInfo } from "../utils/app.js";
import { cookieStore } from "../utils/cookie.js";

export const ACTION_SERVER = "https://m-443.webvpn.nenu.edu.cn";

export const actionLogin = async (
  options: LoginInfo,
): Promise<ActionLoginResponse> => {
  const data = await request<ActionLoginResponse>(`${service}action/login`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });

  if (!data.success) {
    logger.error("登录失败", data.msg);
    handleFailResponse(data);
  }

  return data;
};

export const checkActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}action/check`, {
    method: "POST",
    scope: ACTION_SERVER,
  });

export const ensureActionLogin = async (
  account: LoginInfo,
  check = false,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  const cookies = cookieStore.getCookies(ACTION_SERVER);

  if (cookies.length) {
    if (!check) return null;

    const { valid } = await checkActionCookie();

    if (valid) return null;
  }

  const result = await actionLogin(account);

  return result.success ? null : result;
};

// 小程序会自动解析 302，所以我们需要检查 WebVPN 是否已失效
export const isWebVPNPage = (content: string): boolean =>
  content.includes("fuckvpn") || content.includes("东北师范大学 WebVPN");
