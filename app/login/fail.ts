import { logout } from "./account/index.js";
import { LoginFailType } from "./loginFailTypes.js";
import type { AuthLoginFailedResponse } from "./typings.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { getCurrentRoute } from "../api/framework.js";
import { showToast } from "../api/ui.js";

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
