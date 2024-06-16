import { LoginFailType } from "./loginFailType.js";
import type { CommonFailedResponse } from "./response.js";
import { cookieStore, getCurrentRoute, showToast } from "../../api/index.js";
import { clearUserInfo } from "../../state/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";

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
