import { get, set } from "@mptool/file";

import { type ActionLoginResponse } from "./login-typings.js";
import { request } from "./net.js";
import { type Cookie } from "../../typings/cookie.js";
import { type CookieVerifyResponse } from "../../typings/response.js";
import { service } from "../config/info.js";
import { ACTION_SYSTEM_COOKIE } from "../config/keys.js";
import { type AccountBasicInfo } from "../utils/app.js";

export const actionLogin = (
  options: AccountBasicInfo,
): Promise<ActionLoginResponse> =>
  request<ActionLoginResponse>(`${service}action/login`, {
    method: "POST",
    data: options,
  }).then((data) => {
    if (data.status === "success") set(ACTION_SYSTEM_COOKIE, data.cookies);

    return data;
  });

export const checkActionCookie = (
  cookies: Cookie[],
): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}action/check`, {
    method: "POST",
    data: { cookies },
  });

export const getActionCookie = (
  account: AccountBasicInfo,
  check = false,
): Promise<ActionLoginResponse> => {
  const cookies = get<Cookie[]>(ACTION_SYSTEM_COOKIE);

  return cookies
    ? check
      ? checkActionCookie(cookies).then((valid) =>
          valid ? { status: "success", cookies } : actionLogin(account),
        )
      : Promise.resolve({ status: "success", cookies })
    : actionLogin(account);
};
