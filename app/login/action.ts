import { logger } from "@mptool/all";

import { handleFailResponse } from "./fail.js";
import type {
  ActionLoginResponse,
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/response.js";
import { cookieStore, request } from "../api/net.js";
import type { AccountInfo } from "../utils/typings.js";

export const ACTION_SERVER = "https://m-443.webvpn.nenu.edu.cn";
export const ACTION_MAIN_PAGE = `${ACTION_SERVER}/portal_main/toPortalPage`;

export const actionLogin = async (
  options: AccountInfo,
): Promise<ActionLoginResponse> => {
  const { data } = await request<ActionLoginResponse>("/action/login", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  });

  if (!data.success) {
    logger.error("登录失败", data.msg);
    handleFailResponse(data);
  }

  return data;
};

export const checkActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

export const ensureActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(ACTION_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkActionCookie();

      if (valid) return null;
    }
  }

  const result = await actionLogin(account);

  return result.success ? null : result;
};
