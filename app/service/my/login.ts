import { logger } from "@mptool/all";

import { checkMyCookie, checkOnlineMyCookie } from "./check.js";
import { MY_DOMAIN, MY_MAIN_PAGE, MY_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/user.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { authLocalLogin } from "../auth/login.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { supportRedirect } from "../utils.js";
import type { VPNLoginFailedResponse } from "../vpn/index.js";
import { vpnCASLogin } from "../vpn/login.js";

export interface MyLoginSuccessResponse {
  success: true;
}

export type MyLoginFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export type MyLoginResponse = MyLoginSuccessResponse | MyLoginFailedResponse;

export const myLogin = async (
  options: AccountInfo,
): Promise<MyLoginResponse> => {
  if (!supportRedirect) return onlineMyLogin(options);

  const vpnLoginResponse = await vpnCASLogin(options);

  if (!vpnLoginResponse.success) return vpnLoginResponse;

  const result = await authLocalLogin(options, {
    service: MY_MAIN_PAGE,
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

  const ticketUrl = result.location;
  const ticketResponse = await request(ticketUrl, {
    redirect: "manual",
  });

  if (ticketResponse.status !== 302)
    return {
      success: false,
      type: LoginFailType.Unknown,
      msg: "登录失败",
    };

  const sessionLocation = ticketResponse.headers.get("Location");

  if (sessionLocation?.includes("jsessionid=")) {
    const mainResponse = await request<string>(sessionLocation, {
      redirect: "manual",
    });

    const content = mainResponse.data;

    if (content.includes("<title>网上服务大厅</title>"))
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

export const onlineMyLogin = async (
  options: AccountInfo,
): Promise<MyLoginResponse> => {
  const { data } = await request<MyLoginResponse>("/my/login", {
    method: "POST",
    body: options,
    cookieScope: MY_SERVER,
  });

  if (!data.success) {
    logger.error("登录失败", data.msg);
    handleFailResponse(data);
  }

  return data;
};

const hasCookie = (): boolean =>
  cookieStore.getCookies(MY_SERVER).some(({ domain }) => domain === MY_DOMAIN);

export const ensureMyLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkMyCookie();

      if (valid) return null;
    }
  }

  const result = await myLogin(account);

  return result.success ? null : result;
};

export const ensureOnlineMyLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkOnlineMyCookie();

      if (valid) return null;
    }
  }

  const result = await onlineMyLogin(account);

  return result.success ? null : result;
};
