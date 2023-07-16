import { logger } from "@mptool/all";

import type {
  ActionLoginResponse,
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/response.js";
import { request } from "../api/net.js";
import { service } from "../config/index.js";
import type { AccountBasicInfo } from "../utils/app.js";
import { cookieStore } from "../utils/cookie.js";

export const ACTION_SERVER = "https://m-443.webvpn.nenu.edu.cn";

export const actionLogin = async (
  options: AccountBasicInfo,
): Promise<ActionLoginResponse> => {
  const data = await request<ActionLoginResponse>(`${service}action/login`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });

  if (!data.success) logger.error("登陆失败", data.msg);

  return data;
};

export const checkActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}action/check`, {
    method: "POST",
    scope: ACTION_SERVER,
  });

export const ensureActionLogin = async (
  account: AccountBasicInfo,
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
