import { getCurrentRoute, showToast } from "@mptool/all";

import { ActionFailType } from "./actionFailType.js";
import type { CommonFailedResponse } from "./response.js";
import { cookieStore } from "../../api/index.js";
import { clearUserInfo } from "../../state/index.js";

export const checkAccountStatus = (
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
    void showToast("需要重新登录");

    if (getCurrentRoute() !== "/pkg/user/pages/account/login")
      wx.navigateTo({ url: "/pkg/user/pages/account/login?update=true" });
  }
};
