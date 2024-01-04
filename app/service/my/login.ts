import { logger } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { handleFailResponse } from "../fail.js";
import type { VPNLoginFailedResponse } from "../typings.js";

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

export const checkMyCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/my/check", {
    method: "POST",
    cookieScope: MY_SERVER,
  }).then(({ data }) => data);

export const ensureMyLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(MY_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkMyCookie();

      if (valid) return null;
    }
  }

  const result = await myLogin(account);

  return result.success ? null : result;
};
