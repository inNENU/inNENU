import { ActionFailType } from "./actionFailType.js";
import type { CommonFailedResponse } from "./response.js";
import { cookieStore, getCurrentRoute, showToast } from "../../api/index.js";
import { clearUserInfo } from "../../state/index.js";

export const handleFailResponse = (
  response: CommonFailedResponse<ActionFailType>,
): void => {
  if (
    "type" in response &&
    [
      ActionFailType.NeedCaptcha,
      ActionFailType.WrongPassword,
      ActionFailType.BlackList,
    ].includes(response.type!)
  ) {
    cookieStore.clear();
    clearUserInfo();
    showToast("需要重新登录");

    if (getCurrentRoute() !== "/pkg/user/pages/account/login")
      wx.navigateTo({ url: "/pkg/user/pages/account/login?update=true" });
  }
};
