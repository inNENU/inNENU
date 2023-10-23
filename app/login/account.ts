import { logger, remove } from "@mptool/all";

import { LoginFailType } from "./loginFailTypes.js";
import type { AuthLoginFailedResponse, AuthLoginResponse } from "./typings.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { getCurrentRoute } from "../api/framework.js";
import { request } from "../api/net.js";
import { showToast } from "../api/ui.js";
import { AppOption } from "../app.js";
import {
  ACCOUNT_INFO_KEY,
  BORROW_BOOKS_KEY,
  CARD_BALANCE_KEY,
  CHANGE_MAJOR_DATA_KEY,
  COURSE_DATA_KEY,
  EMAIL_DATA_KEY,
  EXAM_PLACE_DATA_KEY,
  GRADE_DATA_KEY,
  LICENSE_KEY,
  NEWS_LIST_KEY,
  NOTICE_LIST_KEY,
  SITE_ACADEMIC_LIST_KEY,
  SITE_NEWS_LIST_KEY,
  SITE_NOTICE_LIST_KEY,
  SPECIAL_EXAM_DATA_KEY,
  STARRED_INFO_LIST_KEY,
  STARRED_NOTICE_LIST_KEY,
  STUDENT_ARCHIVE_KEY,
  USER_INFO_KEY,
  service,
} from "../config/index.js";
import { cookieStore } from "../utils/cookie.js";
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

export const logout = (): void => {
  // cookies
  cookieStore.clear();

  // account data
  remove(ACCOUNT_INFO_KEY);
  remove(USER_INFO_KEY);

  // license
  remove(LICENSE_KEY);

  // data
  remove(BORROW_BOOKS_KEY);
  remove(CARD_BALANCE_KEY);
  remove(COURSE_DATA_KEY);
  remove(CHANGE_MAJOR_DATA_KEY);
  remove(EMAIL_DATA_KEY);
  remove(EXAM_PLACE_DATA_KEY);
  remove(GRADE_DATA_KEY);
  remove(NEWS_LIST_KEY);
  remove(NOTICE_LIST_KEY);
  remove(SITE_ACADEMIC_LIST_KEY);
  remove(SITE_NEWS_LIST_KEY);
  remove(SITE_NOTICE_LIST_KEY);
  remove(SPECIAL_EXAM_DATA_KEY);
  remove(STARRED_INFO_LIST_KEY);
  remove(STARRED_NOTICE_LIST_KEY);
  remove(STUDENT_ARCHIVE_KEY);

  globalData.account = null;
  globalData.userInfo = null;
};

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
