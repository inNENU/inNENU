import { logger } from "@mptool/all";

import { checkOnlinePostSystemCookie, checkPostSystemCookie } from "./check.js";
import { POST_SYSTEM_HTTPS_SERVER, POST_SYSTEM_HTTP_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLogin } from "../auth/login.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { supportRedirect } from "../utils.js";
import type { VPNLoginFailedResponse } from "../vpn/login.js";

export interface PostSystemLoginSuccessResult {
  success: true;
}

export type PostSystemLoginResult =
  | PostSystemLoginSuccessResult
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export const postSystemLogin = async (
  options: AccountInfo,
): Promise<PostSystemLoginResult> => {
  if (!supportRedirect) return onlinePostSystemLogin(options);

  const result = await authLogin(options, {
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

      return <PostSystemLoginSuccessResult>{
        success: true,
        cookieStore,
      };
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

export const onlinePostSystemLogin = async (
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

export const ensurePostSystemLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(POST_SYSTEM_HTTPS_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkPostSystemCookie();

      if (valid) return null;
    }
  }

  const result = await postSystemLogin(account);

  return result.success ? null : result;
};

export const ensureOnlinePostSystemLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(POST_SYSTEM_HTTPS_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkOnlinePostSystemCookie();

      if (valid) return null;
    }
  }

  const result = await onlinePostSystemLogin(account);

  return result.success ? null : result;
};
