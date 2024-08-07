import { logger } from "@mptool/all";

import {
  checkUnderSystemCookies,
  checkUnderSystemCookiesOnline,
} from "./check.js";
import { UNDER_SYSTEM_DOMAIN, UNDER_SYSTEM_SERVER } from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  AuthLoginFailedResponse,
  LoginMethod,
  VPNLoginFailedResponse,
} from "../../../../service/index.js";
import {
  ActionFailType,
  UnknownResponse,
  authLogin,
  checkAccountStatus,
  createService,
  supportRedirect,
  vpnCASLoginLocal,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";

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

  const vpnLoginResult = await vpnCASLoginLocal(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLogin({
    ...options,
    service: "http://dsjx.nenu.edu.cn:80/",
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

  if (ticketResponse.status !== 302) return UnknownResponse("登录失败");

  const finalLocation = ticketResponse.headers.get("Location");

  if (finalLocation?.includes("http://wafnenu.nenu.edu.cn/offCampus.html"))
    return {
      success: false,
      type: ActionFailType.Forbidden,
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

  return UnknownResponse("登录失败");
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
    checkAccountStatus(data);
  }

  return data;
};

const hasCookie = (): boolean =>
  cookieStore
    .getCookies(UNDER_SYSTEM_SERVER)
    .some(({ domain }) => domain.endsWith(UNDER_SYSTEM_DOMAIN));

const ensureUnderSystemLoginLocal = async (
  account: AccountInfo,
  status: LoginMethod,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "force") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkUnderSystemCookies();

      if (valid) return null;
    }
  }

  const result = await underSystemLoginLocal(account);

  return result.success ? null : result;
};

const ensureUnderSystemLoginOnline = async (
  account: AccountInfo,
  status: LoginMethod,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "force") {
    if (hasCookie()) {
      if (status === "check") return null;

      const { valid } = await checkUnderSystemCookiesOnline();

      if (valid) return null;
    }
  }

  const result = await underSystemLoginOnline(account);

  return result.success ? null : result;
};

export const ensureUnderSystemLogin = createService(
  "under-system-login",
  ensureUnderSystemLoginLocal,
  ensureUnderSystemLoginOnline,
);
