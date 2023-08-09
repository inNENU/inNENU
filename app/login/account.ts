import { logger, remove } from "@mptool/all";

import { LoginFailType } from "./loginFailTypes.js";
import type { AuthLoginFailedResponse, AuthLoginResponse } from "./typings.js";
import type { CommonFailedResponse } from "../../typings/index.js";
import { getCurrentRoute } from "../api/framework.js";
import { request } from "../api/net.js";
import { showToast } from "../api/ui.js";
import { AppOption } from "../app.js";
import { ACCOUNT_INFO_KEY, USER_INFO_KEY, service } from "../config/index.js";
import type { LoginInfo } from "../utils/app.js";

const { globalData } = getApp<AppOption>();

export const AUTH_SERVER = "https://authserver.nenu.edu.cn";
export const WEB_VPN_AUTH_SERVER = "https://authserver-443.webvpn.nenu.edu.cn";

export interface AuthInitInfoResponse {
  success: true;
  needCaptcha: boolean;
  captcha: string;
  params: Record<string, string>;
  salt: string;
}

export const getAuthInit = async (
  id: string,
): Promise<AuthInitInfoResponse | CommonFailedResponse> => {
  const result = await request<AuthInitInfoResponse | CommonFailedResponse>(
    `${service}auth/init?id=${id}`,
    { scope: AUTH_SERVER },
  );

  if (!result.success) logger.error("初始化失败");

  return result;
};

export interface AuthInitOptions extends LoginInfo {
  params: Record<string, string>;
  salt: string;
  captcha: string;
}

export interface AuthInfo {
  /** 登录别名 */
  alias: string;
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: "男" | "女";
  /** 身份证号 */
  idCard: string;
  /** 政治面貌 */
  politicalType: string;
  /** 出生日期 */
  birth: string;
  /** 民族 */
  people: string;

  /** 学号 */
  id: number;
  /** 年级 */
  grade: number;
  /** 学院 */
  school: string;
  /** 专业 */
  major: string;
  /** 专业类别 */
  majorType: string;
  /** 入学日期 */
  inDate: string;

  /** 高考语种 */
  language: string;
  /** 考生号 */
  candidateId: number;
  /** 考生类别 */
  candidateType: string;
  /** 生源省份 */
  province: string;
  /** 培养方式 */
  cultivateType: string;
}

export interface AuthInitSuccessResponse {
  success: true;

  info: AuthInfo | null;
}

export interface AuthInitFailedResponse extends CommonFailedResponse {
  type: LoginFailType;
}

export type AuthInitResponse = AuthInitSuccessResponse | AuthInitFailedResponse;

export const authInit = async (
  data: AuthInitOptions,
): Promise<AuthInitResponse> => {
  const result = await request<AuthInitResponse>(`${service}auth/init`, {
    method: "POST",
    data,
    scope: AUTH_SERVER,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const authLogin = async ({
  id,
  password,
}: LoginInfo): Promise<AuthLoginResponse> => {
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
