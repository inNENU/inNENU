import { logger } from "@mptool/all";

import { handleFailResponse } from "./fail.js";
import type {
  AuthLoginFailedResponse,
  PostSystemLoginResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type { CookieVerifyResponse } from "../../typings/index.js";
import { cookieStore, request } from "../api/index.js";
import type { AccountInfo } from "../utils/typings.js";

export const POST_SYSTEM_SERVER = "https://dsyjs.nenu.edu.cn";

export const postSystemLogin = async (
  options: AccountInfo,
): Promise<PostSystemLoginResponse> => {
  const { data } = await request<PostSystemLoginResponse>(
    "/post-system/login",
    {
      method: "POST",
      body: options,
      cookieScope: POST_SYSTEM_SERVER,
    },
  );

  if (!data.success) {
    logger.error("登录失败", data);
    handleFailResponse(data);
  }

  return data;
};

export const checkPostSystemCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/post-system/check", {
    method: "POST",
    cookieScope: POST_SYSTEM_SERVER,
  }).then(({ data }) => data);

export const ensurePostSystemLogin = async (
  account: AccountInfo,
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(POST_SYSTEM_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkPostSystemCookie();

      if (valid) return null;
    }
  }

  const result = await postSystemLogin(account);

  return result.success ? null : result;
};
