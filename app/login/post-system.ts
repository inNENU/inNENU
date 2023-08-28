import { logger } from "@mptool/all";

import { handleFailResponse } from "./account.js";
import type {
  AuthLoginFailedResponse,
  PostSystemLoginResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/index.js";
import { request } from "../api/index.js";
import { service } from "../config/index.js";
import { cookieStore } from "../utils/cookie.js";
import type { AccountInfo } from "../utils/typings.js";

export const POST_SYSTEM_SERVER = "http://dsyjs.nenu.edu.cn";

export const postSystemLogin = async (
  options: AccountInfo,
): Promise<PostSystemLoginResponse> => {
  const data = await request<PostSystemLoginResponse>(
    `${service}post-system/login`,
    {
      method: "POST",
      data: options,
      scope: POST_SYSTEM_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

export const checkPostSystemCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}post-system/check`, {
    method: "POST",
    scope: POST_SYSTEM_SERVER,
  });

export const ensurePostSystemLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  const cookies = cookieStore.getCookies(POST_SYSTEM_SERVER);

  if (cookies.length) {
    if (!status) return null;

    const { valid } = await checkPostSystemCookie();

    if (valid) return null;
  }

  const result = await postSystemLogin(account);

  return result.success ? null : result;
};
