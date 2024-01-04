import type { AuthLoginFailedResponse } from "./auth/index.js";
import { LoginFailType } from "./loginFailTypes.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { getCurrentRoute, showToast } from "../api/index.js";
import { logout } from "../utils/logout.js";

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
    logout();
    showToast("需要重新登录");

    if (getCurrentRoute() !== "/pages/account/account")
      wx.navigateTo({ url: "/pages/account/account?update=true" });
  }
};
