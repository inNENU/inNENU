import { logger } from "@mptool/all";

import {
  checkUnderStudyCookiesLocal,
  checkUnderStudyCookiesOnline,
} from "./check.js";
import { UNDER_STUDY_SERVER } from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  AuthLoginFailedResponse,
  LoginMethod,
  VPNLoginFailedResponse,
} from "../../../../service/index.js";
import {
  UnknownResponse,
  authLogin,
  checkAccountStatus,
  createService,
  supportRedirect,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";

export interface UnderStudyLoginSuccessResponse {
  success: true;
}

export type UnderStudyLoginResponse =
  | UnderStudyLoginSuccessResponse
  | AuthLoginFailedResponse;

const SSO_LOGIN_URL = `${UNDER_STUDY_SERVER}/new/ssoLogin`;

export const underStudyLoginLocal = async (
  options: AccountInfo,
): Promise<UnderStudyLoginResponse> => {
  if (!supportRedirect) return underStudyLoginOnline(options);

  try {
    const result = await authLogin({
      ...options,
      service: SSO_LOGIN_URL,
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

    if (ticketResponse.status !== 302) {
      return UnknownResponse("登录失败");
    }

    const finalLocation = ticketResponse.headers.get("Location");

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

    return UnknownResponse("登录失败");
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

export const underStudyLoginOnline = async (
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
    checkAccountStatus(data);
  }

  return data;
};

const hasUnderStudyCookies = (): boolean =>
  cookieStore
    .getCookies(UNDER_STUDY_SERVER)
    .some(({ domain }) => domain.endsWith(UNDER_STUDY_SERVER));

const ensureUnderStudyLoginLocal = async (
  account: AccountInfo,
  status: LoginMethod,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (!supportRedirect) return ensureUnderStudyLoginOnline(account, status);

  if (status !== "force") {
    if (hasUnderStudyCookies()) {
      if (status === "check") return null;

      const { valid } = await checkUnderStudyCookiesLocal();

      if (valid) return null;
    }
  }

  const result = await underStudyLoginLocal(account);

  return result.success ? null : result;
};

const ensureUnderStudyLoginOnline = async (
  account: AccountInfo,
  status: LoginMethod,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "force") {
    if (hasUnderStudyCookies()) {
      if (status === "check") return null;

      const { valid } = await checkUnderStudyCookiesOnline();

      if (valid) return null;
    }
  }

  const result = await underStudyLoginOnline(account);

  return result.success ? null : result;
};

export const ensureUnderStudyLogin = createService(
  "under-study",
  ensureUnderStudyLoginLocal,
  ensureUnderStudyLoginOnline,
);
