import { logger, remove } from "@mptool/all";

import { LoginFailType } from "./loginFailTypes.js";
import type { AuthLoginFailedResponse, AuthLoginResponse } from "./typings.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { getCurrentRoute } from "../api/framework.js";
import { request } from "../api/net.js";
import { showToast } from "../api/ui.js";
import { AppOption } from "../app.js";
import { ACCOUNT_INFO_KEY, USER_INFO_KEY, service } from "../config/index.js";
import type { AccountInfo } from "../utils/typings.js";

const { globalData } = getApp<AppOption>();

export const AUTH_SERVER = "https://authserver.nenu.edu.cn";
export const WEB_VPN_AUTH_SERVER = "https://authserver-443.webvpn.nenu.edu.cn";

export const authLogin = async ({
  id,
  password,
}: AccountInfo): Promise<AuthLoginResponse> => {
  const data = await request<AuthLoginResponse>(`${service}auth/login`, {
    method: "POST",
    data: { id, password },
    scope: AUTH_SERVER,
  });

  if (!data.success)
    logger.error("登录失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};

export const handleFailResponse = (
  response: AuthLoginFailedResponse | CommonFailedResponse,
): void => {
  if (
    "type" in response &&
    [LoginFailType.NeedCaptcha, LoginFailType.WrongPassword].includes(
      response.type,
    )
  ) {
    globalData.account = null;
    globalData.userInfo = null;
    remove(ACCOUNT_INFO_KEY);
    remove(USER_INFO_KEY);
    showToast("需要重新登录");

    if (getCurrentRoute() !== "/pages/account/account")
      wx.navigateTo({ url: "/pages/account/account?update=true" });
  }
};
