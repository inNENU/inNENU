import { logger } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../typings/response.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { handleFailResponse } from "../fail.js";
import type { VPNLoginFailedResponse } from "../typings.js";

export interface ActionLoginSuccessResponse {
  success: true;
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export const actionLogin = async (
  options: AccountInfo,
): Promise<ActionLoginResponse> => {
  const { data } = await request<ActionLoginResponse>("/action/login", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  });

  if (!data.success) {
    logger.error("登录失败", data.msg);
    handleFailResponse(data);
  }

  return data;
};

export const checkActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

export const ensureActionLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(ACTION_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkActionCookie();

      if (valid) return null;
    }
  }

  const result = await actionLogin(account);

  return result.success ? null : result;
};
