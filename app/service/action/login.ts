import { logger } from "@mptool/all";

import { checkActionCookiesLocal, checkActionCookiesOnline } from "./check.js";
import { ACTION_DOMAIN, ACTION_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/user.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLocalLogin } from "../auth/index.js";
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

export const actionLoginLocal = async (
  options: AccountInfo,
): Promise<ActionLoginResponse> => {
  if (!supportRedirect) return actionLoginOnline(options);

  const vpnLoginResult = await vpnCASLogin(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLocalLogin(options, {
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

export const actionLoginOnline = async (
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

const hasCookie = (): boolean =>
  cookieStore
    .getCookies(ACTION_SERVER)
    .some(({ domain }) => domain === ACTION_DOMAIN);

export const ensureActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (!supportRedirect) return ensureOnlineActionLogin(account);

  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkActionCookiesLocal();

      if (valid) return null;
    }
  }

  const result = await actionLoginLocal(account);

  return result.success ? null : result;
};

export const ensureOnlineActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkActionCookiesOnline();

      if (valid) return null;
    }
  }

  const result = await actionLoginOnline(account);

  return result.success ? null : result;
};
