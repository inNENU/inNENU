import { logger } from "@mptool/all";

import {
  checkPostSystemCookiesOnline,
  checkPostSystemCookiesLocal,
} from "./check.js";
import {
  POST_SYSTEM_DOMAIN,
  POST_SYSTEM_HTTPS_SERVER,
  POST_SYSTEM_HTTP_SERVER,
} from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/user.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLoginLocal } from "../auth/login.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { createService, supportRedirect } from "../utils.js";
import type { VPNLoginFailedResponse } from "../vpn/login.js";

export interface PostSystemLoginSuccessResult {
  success: true;
}

export type PostSystemLoginResult =
  | PostSystemLoginSuccessResult
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

const postSystemLoginLocal = async (
  options: AccountInfo,
): Promise<PostSystemLoginResult> => {
  if (!supportRedirect) return postSystemLoginOnline(options);

  const result = await authLoginLocal(options, {
    service: `${POST_SYSTEM_HTTP_SERVER}/`,
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
      msg: "此账户无法登录研究生教学服务系统",
    };

  if (
    finalLocation?.startsWith(POST_SYSTEM_HTTP_SERVER) ||
    finalLocation?.startsWith(POST_SYSTEM_HTTPS_SERVER)
  ) {
    const mainResponse = await request<string>(finalLocation, {
      redirect: "manual",
    });

    const location = mainResponse.headers.get("Location");

    if (
      location === `${POST_SYSTEM_HTTP_SERVER}/framework/main.jsp` ||
      location === `${POST_SYSTEM_HTTPS_SERVER}/framework/main.jsp`
    ) {
      const ssoUrl = `${POST_SYSTEM_HTTPS_SERVER}/Logon.do?method=logonBySSO`;

      await request(ssoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return {
        success: true,
        cookieStore,
      } as PostSystemLoginSuccessResult;
    }
  }

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "登录失败",
  };
};

export interface PostSystemLoginSuccessResponse {
  success: true;
}

export type PostSystemLoginResponse =
  | PostSystemLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

const postSystemLoginOnline = async (
  options: AccountInfo,
): Promise<PostSystemLoginResponse> => {
  const { data } = await request<PostSystemLoginResponse>(
    "/post-system/login",
    {
      method: "POST",
      body: options,
      cookieScope: POST_SYSTEM_HTTPS_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

export const postSystemLogin = createService(
  "post-system",
  postSystemLoginLocal,
  postSystemLoginOnline,
);

const checkPostSystemCookies = (): boolean =>
  cookieStore
    .getCookies(POST_SYSTEM_HTTPS_SERVER)
    .some(({ domain }) => domain === POST_SYSTEM_DOMAIN);

const ensurePostSystemLoginLocal = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (checkPostSystemCookies()) {
      if (status === "check") return null;

      const { valid } = await checkPostSystemCookiesLocal();

      if (valid) return null;
    }
  }

  const result = await postSystemLoginLocal(account);

  return result.success ? null : result;
};

const ensurePostSystemLoginOnline = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (checkPostSystemCookies()) {
      if (status === "check") return null;

      const { valid } = await checkPostSystemCookiesOnline();

      if (valid) return null;
    }
  }

  const result = await postSystemLoginOnline(account);

  return result.success ? null : result;
};

export const ensurePostSystemLogin = createService(
  "post-system",
  ensurePostSystemLoginLocal,
  ensurePostSystemLoginOnline,
);
