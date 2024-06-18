import { logger } from "@mptool/all";

import { ACTION_DOMAIN, ACTION_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";
import { user } from "../../state/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLogin } from "../auth/index.js";
import type {
  CommonFailedResponse,
  CookieVerifyResponse,
  FailResponse,
  LoginMethod,
} from "../utils/index.js";
import {
  ActionFailType,
  MissingCredentialResponse,
  checkAccountStatus,
  createService,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";
import type { VPNLoginFailedResponse } from "../vpn/index.js";
import { vpnCASLoginLocal } from "../vpn/index.js";

let currentLogin: Promise<ActionLoginResponse> | null = null;
let loginMethod: LoginMethod = "validate";

const isActionLoggedInLocal = async (): Promise<boolean> => {
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

    if (
      // must no be valid if the status is not 200
      status !== 200 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(data))
    ) {
      return false;
    }

    return data.success;
  } catch (err) {
    return false;
  }
};

const isActionLoggedInOnline = (): Promise<boolean> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data.valid);

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
 * @requires "redirect:manual"
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
    logger.error(result.msg);

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

const actionLoginOnline = (
  options: AccountInfo,
): Promise<ActionLoginResponse> =>
  request<ActionLoginResponse>("/action/login", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

const actionLogin = createService(
  "action-login",
  actionLoginLocal,
  actionLoginOnline,
);

const hasActionCookies = (): boolean =>
  cookieStore
    .getCookies(ACTION_SERVER)
    .some(({ domain }) => domain.startsWith(ACTION_DOMAIN));

export const withActionLogin =
  <R extends { success: boolean }, T extends (...args: any[]) => Promise<R>>(
    serviceHandler: T,
  ) =>
  async (
    ...args: Parameters<T>
  ): Promise<
    | CommonFailedResponse<ActionFailType.MissingCredential>
    | FailResponse<ActionLoginResponse>
    | Awaited<ReturnType<T>>
  > => {
    if (!user.account) return MissingCredentialResponse;

    // check whether cookies exist and avoid re-login if the login state is not expired
    if (hasActionCookies()) {
      let response: Awaited<ReturnType<T>> | null = null;

      // assuming login state is valid if cookies exist
      if (loginMethod === "check") {
        response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
      }

      // validate login state with actual API
      if (loginMethod === "validate") {
        if (await isActionLoggedIn()) {
          response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
        }
      }

      if (response) {
        // check if action is successful
        if (response.success) {
          loginMethod = "check";

          return response;
        }

        // validate login state next time to ensure the login state is correct
        // @ts-expect-error: Response untyped
        if (response.type !== ActionFailType.Expired) {
          loginMethod = "validate";

          return response;
        }
      }
    }

    // ensure only one login action is running
    const response = await (currentLogin ??= actionLogin(user.account));

    // clear the current login promise after log in
    currentLogin = null;

    // successfully logged in
    if (response.success) {
      loginMethod = "check";

      return (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
    }

    logger.error("Action login failed", response);
    loginMethod = "force";
    checkAccountStatus(response);

    return response;
  };
