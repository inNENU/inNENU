import { logger } from "@mptool/all";

import { ACTION_DOMAIN, ACTION_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLogin } from "../auth/index.js";
import type { CookieVerifyResponse, FailResponse } from "../utils/index.js";
import {
  ActionFailType,
  createService,
  handleFailResponse,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";
import type { VPNLoginFailedResponse } from "../vpn/index.js";
import { vpnCASLoginLocal } from "../vpn/index.js";

export const actionState = {
  method: "validate",
  current: null as Promise<ActionLoginResponse> | null,
};

const isActionLoggedInLocal = async (): Promise<CookieVerifyResponse> => {
  try {
    const { data, status } = await request<{ success: boolean }>(
      `${ACTION_SERVER}/page/getidentity`,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        redirect: "manual",
      },
    );

    // must no be valid if the status is not 200
    if (status !== 200) throw -1;

    // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
    // In this case, the response.status will be 200 and the response body will be the WebVPN login page
    if (!supportRedirect && isWebVPNPage(data)) {
      actionState.method = "login";

      return { success: true, valid: false };
    }

    actionState.method = "check";

    return {
      success: true,
      valid: data.success,
    };
  } catch (err) {
    actionState.method = "login";

    return {
      success: true,
      valid: false,
    };
  }
};

const isActionLoggedInOnline = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    actionState.method = data.valid ? "check" : "login";

    return data;
  });

const isActionLoggedIn = createService(
  "action-check",
  isActionLoggedInLocal,
  isActionLoggedInOnline,
);

export interface ActionLoginSuccessResponse {
  success: true;
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

/**
 * @requires "redirect: manual"
 */
const actionLoginLocal = async (
  options: AccountInfo,
): Promise<ActionLoginResponse> => {
  if (!supportRedirect) return actionLoginOnline(options);

  const vpnLoginResult = await vpnCASLoginLocal(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLogin({
    ...options,
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
      type: ActionFailType.Unknown,
      msg: "登录失败",
    };

  const finalLocation = ticketResponse.headers.get("Location");

  if (finalLocation?.startsWith(`${ACTION_SERVER}/portal_main/toPortalPage`))
    return {
      success: true,
    };

  return {
    success: false,
    type: ActionFailType.Unknown,
    msg: "登录失败",
  };
};

const actionLoginOnline = async (
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

const actionLogin = createService(
  "action-login",
  actionLoginLocal,
  actionLoginOnline,
);

const hasActionCookies = (): boolean =>
  cookieStore
    .getCookies(ACTION_SERVER)
    .some(({ domain }) => domain === ACTION_DOMAIN);

export const ensureActionLogin = async (
  account: AccountInfo,
): Promise<FailResponse<ActionLoginResponse> | null> => {
  if (actionState.method !== "force") {
    if (hasActionCookies()) {
      if (actionState.method === "check") return null;

      const { valid } = await isActionLoggedIn();

      if (valid) return null;
    }
  }

  const result = await (actionState.current ??= actionLogin(account));

  actionState.current = null;

  return result.success ? null : result;
};
