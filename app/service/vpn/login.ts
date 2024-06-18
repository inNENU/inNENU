/* eslint-disable @typescript-eslint/naming-convention */
import { URLSearchParams } from "@mptool/all";

import { VPN_DOMAIN, VPN_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";
import type { AuthLoginFailedResponse } from "../auth/login.js";
import { authLogin } from "../auth/login.js";
import type { CommonFailedResponse } from "../utils/index.js";
import { ActionFailType } from "../utils/index.js";

const AUTHENTICITY_TOKEN_REGEXP =
  /<input\s+type="hidden"\s+name="authenticity_token" value="(.*?)" \/>/;

const LOGIN_URL = `${VPN_SERVER}/users/sign_in`;
const CAS_LOGIN_URL = `${VPN_SERVER}/users/auth/cas`;
const UPDATE_KEY_URL = `${VPN_SERVER}/vpn_key/update`;

export interface VPNLoginSuccessResponse {
  success: true;
}

export type VPNLoginFailedResponse = CommonFailedResponse<
  | ActionFailType.AccountLocked
  | ActionFailType.WrongPassword
  | ActionFailType.Unknown
>;

export type VPNLoginResponse =
  | VPNLoginSuccessResponse
  | VPNLoginFailedResponse
  | AuthLoginFailedResponse;

export const vpnLoginLocal = async ({
  id,
  password,
}: AccountInfo): Promise<VPNLoginResponse> => {
  const { data: content } = await request<string>(LOGIN_URL);

  const authenticityToken = AUTHENTICITY_TOKEN_REGEXP.exec(content)![1];

  const loginResponse = await request<string>(LOGIN_URL, {
    method: "POST",
    body: new URLSearchParams({
      utf8: "✓",
      authenticity_token: authenticityToken,
      "user[login]": id.toString(),
      "user[password]": password,
      "user[dymatice_code]": "unknown",
      "user[otp_with_capcha]": "false",
      commit: "登录 Login",
    }),
    redirect: "manual",
  });

  const location = loginResponse.headers.get("Location");

  if (loginResponse.status === 302) {
    if (location === LOGIN_URL)
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: "短时间内登录过多，本机已被屏蔽。请稍后重试",
      };

    if (location === UPDATE_KEY_URL) {
      await request(UPDATE_KEY_URL);

      return {
        success: true,
      };
    }
  }

  if (loginResponse.status === 200) {
    const { data: content } = loginResponse;

    if (content.includes("用户名或密码错误, 超过五次将被锁定。"))
      return {
        success: false,
        type: ActionFailType.WrongPassword,
        msg: "用户名或密码错误, 超过五次将被锁定。",
      };

    if (content.includes("您的帐号已被锁定, 请在十分钟后再尝试。"))
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: "您的帐号已被锁定, 请在十分钟后再尝试。",
      };
  }

  console.error("Unknown VPN login response:", loginResponse.data);

  return {
    success: false,
    type: ActionFailType.Unknown,
    msg: "未知错误",
  };
};

export const vpnCASLoginLocal = async ({
  id,
  password,
}: AccountInfo): Promise<VPNLoginResponse> => {
  // clear VPN cookies
  cookieStore.clear(VPN_DOMAIN);

  const { status } = await request<string>(CAS_LOGIN_URL, {
    redirect: "manual",
  });

  if (status === 302) {
    const authResult = await authLogin({
      id,
      password,
      service: `${VPN_SERVER}/users/auth/cas/callback?url=${encodeURIComponent(
        `${VPN_SERVER}/users/sign_in`,
      )}`,
    });

    if (!authResult.success) return authResult;

    const callbackResponse = await request(authResult.location, {
      redirect: "manual",
    });

    if (callbackResponse.status === 500)
      return {
        success: false,
        type: ActionFailType.Unknown,
        msg: "学校 WebVPN 服务崩溃，请稍后重试。",
      };

    const location = callbackResponse.headers.get("Location");

    if (callbackResponse.status === 302) {
      if (location === LOGIN_URL)
        return {
          success: false,
          type: ActionFailType.AccountLocked,
          msg: "短时间内登录失败过多，账户已锁定。请 10 分钟后重试",
        };

      if (location === UPDATE_KEY_URL) {
        await request(UPDATE_KEY_URL);

        return {
          success: true,
        };
      }
    }
  }

  if (status === 500)
    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: "学校 WebVPN 服务崩溃，请稍后重试。",
    };

  return {
    success: false,
    type: ActionFailType.Unknown,
    msg: "未知错误",
  };
};
