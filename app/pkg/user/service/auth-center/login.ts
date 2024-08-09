import { logger } from "@mptool/all";

import { CENTER_PAGE, CENTER_PREFIX } from "./utils.js";
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

let currentLogin: Promise<AuthCenterLoginResponse> | null = null;
let loginMethod: LoginMethod = "validate";

export const isAuthCenterLoggedInLocal = async (): Promise<boolean> => {
  try {
    const response = await request<string>(CENTER_PAGE, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Cache-Control": "no-cache",
      },
      redirect: "manual",
    });

    return response.status === 200;
  } catch {
    return false;
  }
};

export const isAuthCenterLoggedInOnline = (): Promise<boolean> =>
  request<CookieVerifyResponse>("/auth-center/check", {
    method: "POST",
    cookieScope: CENTER_PREFIX,
  }).then(({ data }) => data.valid);

const isAuthCenterLoggedIn = createService(
  "auth-center-check",
  isAuthCenterLoggedInLocal,
  isAuthCenterLoggedInOnline,
);

export type AuthCenterLoginResponse =
  | { success: true }
  | AuthLoginFailedResponse;

/**
 * @requires "redirect:manual"
 */
export const authCenterLoginLocal = async (
  options: AccountInfo,
): Promise<AuthCenterLoginResponse> => {
  if (!supportRedirect) return authCenterLoginOnline(options);

  const result = await authLogin({
    ...options,
    service: CENTER_PAGE,
  });

  if (!result.success) {
    console.error(result.msg);

    return result;
  }

  const ticketUrl = result.location;

  const ticketResponse = await request(ticketUrl, {
    redirect: "manual",
  });

  if (ticketResponse.status !== 302) return UnknownResponse("登录失败");

  const finalLocation = ticketResponse.headers.get("Location");

  if (finalLocation === CENTER_PAGE) {
    return { success: true };
  }

  return UnknownResponse("登录失败");
};

export const authCenterLoginOnline = async (
  options: AccountInfo,
): Promise<AuthCenterLoginResponse> =>
  request<AuthCenterLoginResponse>("/auth-center/login", {
    method: "POST",
    body: options,
    cookieScope: CENTER_PREFIX,
  }).then(({ data }) => data);

const authCenterLogin = createService(
  "auth-center-login",
  authCenterLoginLocal,
  authCenterLoginOnline,
);

const hasAuthCenterCookies = (): boolean =>
  cookieStore
    .getCookies(CENTER_PREFIX)
    .some(({ domain }) => domain.endsWith(CENTER_PREFIX));

export const withAuthCenterLogin =
  <R extends { success: boolean }, T extends (...args: any[]) => Promise<R>>(
    serviceHandler: T,
  ) =>
  async (
    ...args: Parameters<T>
  ): Promise<
    | CommonFailedResponse<ActionFailType.MissingCredential>
    | FailResponse<AuthCenterLoginResponse>
    | Awaited<ReturnType<T>>
  > => {
    if (!user.account) return MissingCredentialResponse;

    // check whether cookies exist and avoid re-login if the login state is not expired
    if (hasAuthCenterCookies()) {
      let response: Awaited<ReturnType<T>> | null = null;

      // assuming login state is valid if cookies exist
      if (loginMethod === "check") {
        response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
      }

      // validate login state with actual API
      if (loginMethod === "validate") {
        if (await isAuthCenterLoggedIn()) {
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
    const response = await (currentLogin ??= authCenterLogin(user.account));

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
