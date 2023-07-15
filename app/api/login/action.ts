import { logger } from "@mptool/all";

import {
  type ActionLoginResponse,
  type AuthLoginFailedResponse,
  type VPNLoginFailedResponse,
} from "./typings.js";
import { type CookieVerifyResponse } from "../../../typings/response.js";
import { service } from "../../config/info.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { cookieStore } from "../cookie.js";
import { request } from "../net.js";

export const ACTION_SERVER = "https://m-443.webvpn.nenu.edu.cn";

export const actionLogin = (
  options: AccountBasicInfo,
): Promise<ActionLoginResponse> =>
  request<ActionLoginResponse>(`${service}action/login`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("登陆失败", data.msg);

    return data;
  });

export const checkActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}action/check`, {
    method: "POST",
    scope: ACTION_SERVER,
  });

export const ensureActionLogin = (
  account: AccountBasicInfo,
  check = false,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  const cookies = cookieStore.getCookies(ACTION_SERVER);

  return cookies.length
    ? check
      ? checkActionCookie().then((valid) =>
          valid
            ? null
            : actionLogin(account).then((res) => (res.success ? null : res)),
        )
      : Promise.resolve(null)
    : actionLogin(account).then((res) => (res.success ? null : res));
};
