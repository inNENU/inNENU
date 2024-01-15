import { logger } from "@mptool/all";

import { checkActionCookie, checkOnlineActionCookie } from "./check.js";
import { ACTION_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLogin } from "../auth/index.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { supportRedirect } from "../utils.js";
import type { VPNLoginFailedResponse } from "../vpn/index.js";
import { vpnCASLogin } from "../vpn/index.js";

export interface ActionLoginSuccessResponse {
  success: true;
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export const actionLogin = async (
  options: AccountInfo,
): Promise<ActionLoginResponse> => {
  if (!supportRedirect) return actionOnlineLogin(options);

  const vpnLoginResult = await vpnCASLogin(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLogin(options, {
    service: `${ACTION_SERVER}/portal_main/toPortalPage`,
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

  if (finalLocation?.startsWith(`${ACTION_SERVER}/portal_main/toPortalPage`))
    return {
      success: true,
    };

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "登录失败",
  };
};

export const actionOnlineLogin = async (
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

export const ensureActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (!supportRedirect) return ensureOnlineActionLogin(account);

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

export const ensureOnlineActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(ACTION_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkOnlineActionCookie();

      if (valid) return null;
    }
  }

  const result = await actionOnlineLogin(account);

  return result.success ? null : result;
};
