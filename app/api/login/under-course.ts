import { logger } from "@mptool/all";

import {
  AuthLoginFailedResponse,
  type UnderSystemLoginResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import { type CookieVerifyResponse } from "../../../typings/index.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { cookieStore } from "../cookie.js";

export const UNDER_SYSTEM_SERVER = "https://dsjx.webvpn.nenu.edu.cn";

export const underSystemLogin = (
  options: AccountBasicInfo,
): Promise<UnderSystemLoginResponse> =>
  request<UnderSystemLoginResponse>(`${service}under-system/login`, {
    method: "POST",
    data: options,
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("登录失败", data);

    return data;
  });

export const checkUnderSystemCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}under-system/check`, {
    method: "POST",
    scope: UNDER_SYSTEM_SERVER,
  });

export const ensureUnderSystemLogin = (
  account: AccountBasicInfo,
  check = false,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  const cookies = cookieStore.getCookies(UNDER_SYSTEM_SERVER);

  return cookies
    ? check
      ? checkUnderSystemCookie().then((valid) =>
          valid
            ? null
            : underSystemLogin(account).then((res) =>
                res.success ? null : res,
              ),
        )
      : Promise.resolve(null)
    : underSystemLogin(account).then((res) => (res.success ? null : res));
};
