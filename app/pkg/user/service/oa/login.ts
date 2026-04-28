import { logger } from "@mptool/all";

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
  unknownResponse,
  authLogin,
  checkAccountStatus,
  createService,
  supportRedirect,
  vpnCASLoginLocal,
} from "../../../../service/index.js";
import type { AccountInfo } from "../../../../state/index.js";
import { user } from "../../../../state/index.js";
import { OA_ENTRANCE_PAGE, OA_MAIN_PAGE, OA_WEB_VPN_DOMAIN, OA_WEB_VPN_SERVER } from "./utils.js";

let currentLogin: Promise<OALoginResponse> | null = null;
let loginMethod: LoginMethod = "validate";

export const isOALoggedInLocal = async (): Promise<boolean> => {
  try {
    const { data, status } = await request<{
      status: boolean;
      _data: { _user: Record<string, string> };
    }>(`${OA_WEB_VPN_SERVER}/api/ecode/sync`, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      redirect: "manual",
    });

    // oxlint-disable-next-line no-underscore-dangle
    return status === 200 && data.status && "_user" in data._data;
  } catch {
    return false;
  }
};

export const isOALoggedInOnline = (): Promise<boolean> =>
  request<CookieVerifyResponse>("/oa/check", {
    method: "POST",
    cookieScope: OA_WEB_VPN_SERVER,
  }).then(({ data }) => data.valid);

const isOALoggedIn = createService("oa-check", isOALoggedInLocal, isOALoggedInOnline);

export type OALoginFailedResponse = AuthLoginFailedResponse;

export type OALoginResponse = { success: true } | OALoginFailedResponse;

export const oaLoginOnline = async (options: AccountInfo): Promise<OALoginResponse> =>
  request<OALoginResponse>("/oa/login", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

/*
 * requires "redirect:manual"
 */
export const oaLoginLocal = async (options: AccountInfo): Promise<OALoginResponse> => {
  if (!supportRedirect) return oaLoginOnline(options);

  const vpnLoginResult = await vpnCASLoginLocal(options);

  if (!vpnLoginResult.success) return vpnLoginResult;

  const result = await authLogin({
    ...options,
    service: OA_ENTRANCE_PAGE,
    webVPN: true,
  });

  if (!result.success) {
    logger.error(result.msg);

    return result;
  }

  const ticketResponse = await request<string>(result.location, {
    redirect: "manual",
  });

  if (ticketResponse.status !== 302) {
    console.error("Login to OA failed", ticketResponse.status, ticketResponse.data);

    return unknownResponse("登录失败");
  }
  const sessionLocation = ticketResponse.headers.get("Location");

  if (sessionLocation?.includes("jsessionid=")) {
    const sessionResponse = await request<string>(sessionLocation, {
      redirect: "manual",
    });

    if (
      sessionResponse.status === 302 &&
      sessionResponse.headers.get("Location") === OA_MAIN_PAGE
    ) {
      return {
        success: true,
      };
    }
  }

  console.error("login to OA failed", sessionLocation);

  return unknownResponse("登录失败");
};

const oaLogin = createService("oa-login", oaLoginLocal, oaLoginOnline);

const hasOACookies = (): boolean =>
  cookieStore
    .getCookies(OA_WEB_VPN_SERVER)
    .some(({ domain }) => domain.endsWith(OA_WEB_VPN_DOMAIN));

export const withOALogin =
  // oxlint-disable-next-line typescript/no-explicit-any
  <Returns extends { success: boolean }, T extends (...args: any[]) => Promise<Returns>>(
    serviceHandler: T,
  ) =>
    async (
      ...args: Parameters<T>
    ): Promise<
      | CommonFailedResponse<ActionFailType.MissingCredential>
      | FailResponse<OALoginResponse>
      | Awaited<ReturnType<T>>
    > => {
      if (!user.account) return MissingCredentialResponse;

      // check whether cookies exist and avoid re-login if the login state is not expired
      if (hasOACookies()) {
        let response: Awaited<ReturnType<T>> | null = null;

        // assuming login state is valid if cookies exist
        if (loginMethod === "check")
          response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;

        // validate login state with actual API
        if (loginMethod === "validate" && (await isOALoggedIn()))
          response = (await serviceHandler(...args)) as Awaited<ReturnType<T>>;

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
      const response = await (currentLogin ??= oaLogin(user.account));

      // clear the current login promise after log in
      currentLogin = null;

      // successfully logged in
      if (response.success) {
        loginMethod = "check";

        return (await serviceHandler(...args)) as Awaited<ReturnType<T>>;
      }

      logger.error("OA login failed", response);
      loginMethod = "force";
      checkAccountStatus(response);

      return response;
    };
