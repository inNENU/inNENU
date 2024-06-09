import { logger } from "@mptool/all";

import {
  checkOnlineUnderSystemCookie,
  checkUnderSystemCookie,
} from "./check.js";
import { UNDER_SYSTEM_DOMAIN, UNDER_SYSTEM_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/user.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLocalLogin } from "../auth/index.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { createService, supportRedirect } from "../utils.js";
import type { VPNLoginFailedResponse } from "../vpn/index.js";
import { vpnCASLogin } from "../vpn/login.js";

export interface UnderSystemLoginSuccessResponse {
  success: true;
}

export type UnderSystemLoginResponse =
  | UnderSystemLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export const underSystemLoginLocal = async (
  options: AccountInfo,
): Promise<UnderSystemLoginResponse> => {
  if (!supportRedirect) return underSystemLoginOnline(options);

  const vpnLoginResult = await vpnCASLogin(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLocalLogin(options, {
    service: "http://dsjx.nenu.edu.cn:80/",
    webVPN: true,
  });

  if (!result.success) {
    console.error(result.msg);

    return {
      success: false,
      type: result.type,
      msg: result.msg,
    };
  }

  console.log("Login location", result.location);

  const ticketResponse = await request<string>(result.location, {
    redirect: "manual",
  });

  if (ticketResponse.status !== 302)
    return {
      success: false,
      type: LoginFailType.Unknown,
      msg: "登录失败",
    };

  const finalLocation = ticketResponse.headers.get("Location");

  if (finalLocation?.includes("http://wafnenu.nenu.edu.cn/offCampus.html"))
    return {
      success: false,
      type: LoginFailType.Forbidden,
      msg: "此账户无法登录本科教学服务系统",
    };

  if (finalLocation?.includes(";jsessionid=")) {
    const ssoUrl = `${UNDER_SYSTEM_SERVER}/Logon.do?method=logonBySSO`;

    await request(ssoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      success: true,
    };
  }

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "登录失败",
  };
};

export const underSystemLoginOnline = async (
  options: AccountInfo,
): Promise<UnderSystemLoginResponse> => {
  const { data } = await request<UnderSystemLoginResponse>(
    "/under-system/login",
    {
      method: "POST",
      body: options,
      cookieScope: UNDER_SYSTEM_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

const hasCookie = (): boolean =>
  cookieStore
    .getCookies(UNDER_SYSTEM_SERVER)
    .some(({ domain }) => domain === UNDER_SYSTEM_DOMAIN);

export const ensureUnderSystemLoginLocal = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkUnderSystemCookie();

      if (valid) return null;
    }
  }

  const result = await underSystemLoginLocal(account);

  return result.success ? null : result;
};

export const ensureUnderSystemLoginOnline = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkOnlineUnderSystemCookie();

      if (valid) return null;
    }
  }

  const result = await underSystemLoginOnline(account);

  return result.success ? null : result;
};

export const ensureUnderSystemLogin = createService(
  "under-login",
  ensureUnderSystemLoginLocal,
  ensureUnderSystemLoginOnline,
);
