import { get } from "@mptool/file";

import { type ActionLoginResponse } from "./login-typings.js";
import { request } from "./net.js";
import { type Cookie } from "../../typings/cookie.js";
import { type CookieVerifyResponse } from "../../typings/response.js";
import { service } from "../config/info.js";
import { ACTION_SYSTEM_COOKIE } from "../config/keys.js";
import { type AccountBasicInfo } from "../utils/app.js";

export const getActionCookie = (
  options: AccountBasicInfo,
): Promise<ActionLoginResponse> =>
  request<ActionLoginResponse>(`${service}action/login`, {
    method: "POST",
    data: options,
  });

export const checkActionCookie = (
  cookies: Cookie[],
): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}action/check`, {
    method: "POST",
    data: { cookies },
  });

export const actionLogin = (
  account: AccountBasicInfo,
): Promise<ActionLoginResponse> => {
  const cookies = get<Cookie[]>(ACTION_SYSTEM_COOKIE);

  return cookies
    ? checkActionCookie(cookies).then((valid) =>
        valid ? { status: "success", cookies } : getActionCookie(account),
      )
    : getActionCookie(account);
};
