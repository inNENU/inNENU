import { logger } from "@mptool/all";

import {
  checkGradSystemCookiesLocal,
  checkGradSystemCookiesOnline,
} from "./check.js";
import {
  GRAD_OLD_SYSTEM_DOMAIN,
  GRAD_OLD_SYSTEM_HTTPS_SERVER,
  GRAD_OLD_SYSTEM_HTTP_SERVER,
} from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "../../../../service/index.js";
import {
  LoginFailType,
  authLogin,
  createService,
  handleFailResponse,
  supportRedirect,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";

export interface GradSystemLoginSuccessResult {
  success: true;
}

export type GradSystemLoginResult =
  | GradSystemLoginSuccessResult
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

const gradOldSystemLoginLocal = async (
  options: AccountInfo,
): Promise<GradSystemLoginResult> => {
  if (!supportRedirect) return gradOldSystemLoginOnline(options);

  const result = await authLogin({
    ...options,
    service: `${GRAD_OLD_SYSTEM_HTTP_SERVER}/`,
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
    finalLocation?.startsWith(GRAD_OLD_SYSTEM_HTTP_SERVER) ||
    finalLocation?.startsWith(GRAD_OLD_SYSTEM_HTTPS_SERVER)
  ) {
    const mainResponse = await request<string>(finalLocation, {
      redirect: "manual",
    });

    const location = mainResponse.headers.get("Location");

    if (
      location === `${GRAD_OLD_SYSTEM_HTTP_SERVER}/framework/main.jsp` ||
      location === `${GRAD_OLD_SYSTEM_HTTPS_SERVER}/framework/main.jsp`
    ) {
      const ssoUrl = `${GRAD_OLD_SYSTEM_HTTPS_SERVER}/Logon.do?method=logonBySSO`;

      await request(ssoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return {
        success: true,
        cookieStore,
      } as GradSystemLoginSuccessResult;
    }
  }

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "登录失败",
  };
};

export interface GradSystemLoginSuccessResponse {
  success: true;
}

export type GradSystemLoginResponse =
  | GradSystemLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

const gradOldSystemLoginOnline = async (
  options: AccountInfo,
): Promise<GradSystemLoginResponse> => {
  const { data } = await request<GradSystemLoginResponse>(
    "/grad-old-system/login",
    {
      method: "POST",
      body: options,
      cookieScope: GRAD_OLD_SYSTEM_HTTPS_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

export const gradOldSystemLogin = createService(
  "grad-old-system-login",
  gradOldSystemLoginLocal,
  gradOldSystemLoginOnline,
);

const checkGradOldSystemCookies = (): boolean =>
  cookieStore
    .getCookies(GRAD_OLD_SYSTEM_HTTPS_SERVER)
    .some(({ domain }) => domain === GRAD_OLD_SYSTEM_DOMAIN);

const ensureGradOldSystemLoginLocal = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (checkGradOldSystemCookies()) {
      if (status === "check") return null;

      const { valid } = await checkGradSystemCookiesLocal();

      if (valid) return null;
    }
  }

  const result = await gradOldSystemLoginLocal(account);

  return result.success ? null : result;
};

const ensureGradOldSystemLoginOnline = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    if (checkGradOldSystemCookies()) {
      if (status === "check") return null;

      const { valid } = await checkGradSystemCookiesOnline();

      if (valid) return null;
    }
  }

  const result = await gradOldSystemLoginOnline(account);

  return result.success ? null : result;
};

export const ensureGradOldSystemLogin = createService(
  "grad-old-system-login",
  ensureGradOldSystemLoginLocal,
  ensureGradOldSystemLoginOnline,
);
