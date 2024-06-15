import type { AuthLoginFailedResponse } from "./auth/index.js";
import { LoginFailType } from "./loginFailTypes.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { cookieStore, getCurrentRoute, showToast } from "../api/index.js";
import { clearUserInfo } from "../state/index.js";

export const handleFailResponse = (
  response: AuthLoginFailedResponse | CommonFailedResponse,
): void => {
  if (
    "type" in response &&
    [
      LoginFailType.NeedCaptcha,
      LoginFailType.WrongPassword,
      LoginFailType.BlackList,
    ].includes(response.type)
  ) {
    cookieStore.clear();
    clearUserInfo();
    showToast("需要重新登录");

    if (getCurrentRoute() !== "/pkg/user/pages/account/login")
      wx.navigateTo({ url: "/pkg/user/pages/account/login?update=true" });
  }
};
