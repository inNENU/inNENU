import { logger } from "@mptool/all";

import { checkOnlineUnderStudyCookie, checkUnderStudyCookie } from "./check.js";
import { UNDER_STUDY_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/user.js";
import type { AuthLoginFailedResponse } from "../auth/login.js";
import { authLogin } from "../auth/login.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { supportRedirect } from "../utils.js";
import { VPNLoginFailedResponse } from "../vpn/login.js";

export interface UnderStudyLoginSuccessResponse {
  success: true;
}

export type UnderStudyLoginResponse =
  | UnderStudyLoginSuccessResponse
  | AuthLoginFailedResponse;

const SSO_LOGIN_URL = `${UNDER_STUDY_SERVER}/new/ssoLogin`;

export const underStudyLogin = async (
  options: AccountInfo,
): Promise<UnderStudyLoginResponse> => {
  if (!supportRedirect) return onlineUnderStudyLogin(options);

  try {
    const result = await authLogin(options, {
      service: SSO_LOGIN_URL,
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

    if (ticketResponse.status !== 302) {
      console.log("ticket response", ticketResponse.data);

      return {
        success: false,
        type: LoginFailType.Unknown,
        msg: "登录失败",
      };
    }

    const finalLocation = ticketResponse.headers.get("Location");

    console.log("location: ", finalLocation);

    if (finalLocation === SSO_LOGIN_URL) {
      const ssoResponse = await request<string>(SSO_LOGIN_URL, {
        redirect: "manual",
      });

      if (
        ssoResponse.status === 302 &&
        ssoResponse.headers.get("Location") ===
          `${UNDER_STUDY_SERVER}/new/welcome.page`
      )
        return {
          success: true,
        };
    }

    return {
      success: false,
      type: LoginFailType.Unknown,
      msg: "登录失败",
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return {
      success: false,
      type: LoginFailType.Unknown,
      msg: message,
    };
  }
};

export const onlineUnderStudyLogin = async (
  options: AccountInfo,
): Promise<UnderStudyLoginResponse> => {
  const { data } = await request<UnderStudyLoginResponse>(
    "/under-study/login",
    {
      method: "POST",
      body: options,
      cookieScope: UNDER_STUDY_SERVER,
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
    .getCookies(UNDER_STUDY_SERVER)
    .some(({ domain }) => domain === UNDER_STUDY_SERVER);

export const ensureUnderStudyLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (!supportRedirect) return ensureOnlineUnderStudyLogin(account);

  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkUnderStudyCookie();

      if (valid) return null;
    }
  }

  const result = await underStudyLogin(account);

  return result.success ? null : result;
};

export const ensureOnlineUnderStudyLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkOnlineUnderStudyCookie();

      if (valid) return null;
    }
  }

  const result = await onlineUnderStudyLogin(account);

  return result.success ? null : result;
};
