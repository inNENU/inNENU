import { logger } from "@mptool/all";

import { UNDER_STUDY_SERVER } from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  ActionFailType,
  AuthLoginFailedResponse,
  CommonFailedResponse,
  CookieVerifyResponse,
  FailResponse,
  LoginMethod,
} from "../../../../service/index.js";
import {
  MissingCredentialResponse,
  UnknownResponse,
  authLogin,
  checkAccountStatus,
  createService,
  supportRedirect,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";
import { user } from "../../../../state/index.js";

let currentLogin: Promise<UnderStudyLoginResponse> | null = null;
let loginMethod: LoginMethod = "validate";

export const isUnderStudyLoggedInLocal = async (): Promise<boolean> => {
  try {
    const response = await request<string>(UNDER_STUDY_SERVER, {
      redirect: "manual",
    });

    if (response.status === 302) {
      const location = response.headers.get("location");

      if (location?.startsWith(`${UNDER_STUDY_SERVER}/new/welcome.page`))
        return true;
    }

    throw -1;
  } catch (err) {
    return false;
  }
};

export const isUnderStudyLoggedInOnline = (): Promise<boolean> =>
  request<CookieVerifyResponse>("/under-study/check", {
    method: "POST",
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data.valid);

const isUnderStudyLoggedIn = createService(
  "under-study-check",
  isUnderStudyLoggedInLocal,
  isUnderStudyLoggedInOnline,
);

export interface UnderStudyLoginSuccessResponse {
  success: true;
}

export type UnderStudyLoginResponse =
  | UnderStudyLoginSuccessResponse
  | AuthLoginFailedResponse;

const SSO_LOGIN_URL = `${UNDER_STUDY_SERVER}/new/ssoLogin`;

/**
 * @requires "redirect:manual"
 */
export const underStudyLoginLocal = async (
  options: AccountInfo,
): Promise<UnderStudyLoginResponse> => {
  if (!supportRedirect) return underStudyLoginOnline(options);

  const result = await authLogin({
    ...options,
    service: SSO_LOGIN_URL,
  });

  if (!result.success) {
    logger.error(result.msg);

    return result;
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
      ssoResponse.headers
        .get("Location")
        ?.startsWith(`${UNDER_STUDY_SERVER}/new/welcome.page`)
    )
      return {
        success: true,
      };
  }

  return UnknownResponse("登录失败");
};

export const underStudyLoginOnline = async (
  options: AccountInfo,
): Promise<UnderStudyLoginResponse> =>
  request<UnderStudyLoginResponse>("/under-study/login", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

const underStudyLogin = createService(
  "under-study-login",
  underStudyLoginLocal,
  underStudyLoginOnline,
);

const hasUnderStudyCookies = (): boolean =>
  cookieStore
    .getCookies(UNDER_STUDY_SERVER)
    .some(({ domain }) => domain.endsWith(UNDER_STUDY_SERVER));

export const withUnderStudyLogin =
  <R extends { success: boolean }, T extends (...args: any[]) => Promise<R>>(
    serviceHandler: T,
  ) =>
  async (
    ...args: Parameters<T>
  ): Promise<
    | CommonFailedResponse<ActionFailType.MissingCredential>
    | FailResponse<UnderStudyLoginResponse>
    | Awaited<ReturnType<T>>
  > => {
    if (!user.account) return MissingCredentialResponse;

    // check whether cookies exist and avoid re-login if the login state is not expired
    if (hasUnderStudyCookies()) {
      let response: Awaited<ReturnType<T>> | null = null;

      // assuming login state is valid if cookies exist
      if (loginMethod === "check") {
        response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
      }

      // validate login state with actual API
      if (loginMethod === "validate") {
        if (await isUnderStudyLoggedIn()) {
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
    const response = await (currentLogin ??= underStudyLogin(user.account));

    // clear the current login promise after log in
    currentLogin = null;

    // successfully logged in
    if (response.success) {
      loginMethod = "check";

      return (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
    }

    logger.error("Under study login failed", response);
    loginMethod = "force";
    checkAccountStatus(response);

    return response;
  };
