import { logger } from "@mptool/all";

import { handleFailResponse } from "./account.js";
import type {
  AuthLoginFailedResponse,
  UnderSystemLoginResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/index.js";
import { request } from "../api/index.js";
import { service } from "../config/index.js";
import { cookieStore } from "../utils/cookie.js";
import type { AccountInfo } from "../utils/typings.js";

export const UNDER_SYSTEM_SERVER = "https://dsjx.webvpn.nenu.edu.cn";

export const underSystemLogin = async (
  options: AccountInfo,
): Promise<UnderSystemLoginResponse> => {
  const data = await request<UnderSystemLoginResponse>(
    `${service}under-system/login`,
    {
      method: "POST",
      data: options,
      scope: UNDER_SYSTEM_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

export const checkUnderSystemCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}under-system/check`, {
    method: "POST",
    scope: UNDER_SYSTEM_SERVER,
  });

export const ensureUnderSystemLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(UNDER_SYSTEM_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkUnderSystemCookie();

      if (valid) return null;
    }
  }

  const result = await underSystemLogin(account);

  return result.success ? null : result;
};
