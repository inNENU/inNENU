import { URLSearchParams, logger } from "@mptool/all";

import { authEncrypt } from "./encrypt.js";
import {
  AUTH_DOMAIN,
  AUTH_SERVER,
  SALT_REGEXP,
  WEB_VPN_AUTH_DOMAIN,
  WEB_VPN_AUTH_SERVER,
} from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../utils/typings.js";
import { LoginFailType } from "../loginFailTypes.js";
import { supportRedirect } from "../utils.js";

export interface AuthLoginOptions {
  service?: string;
  webVPN?: boolean;
}

export interface AuthLoginSuccessResponse {
  success: true;
  location: string;
}

export interface AuthLoginFailedResponse extends CommonFailedResponse {
  type: Exclude<LoginFailType, LoginFailType.WrongCaptcha>;
}

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
  | AuthLoginFailedResponse;

export const authLogin = async (
  { id, password }: AccountInfo,
  { service = "", webVPN = false }: AuthLoginOptions = {},
): Promise<AuthLoginResponse> => {
  // only use local login when redirect is supported
  if (!supportRedirect) return authOnlineLogin({ id, password });

  // TODO: Add black list
  // if (isInBlackList(id))
  //   return {
  //     success: false,
  //     type: LoginFailType.BlackList,
  //     msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
  //   };

  const domain = webVPN ? WEB_VPN_AUTH_DOMAIN : AUTH_DOMAIN;
  const server = webVPN ? WEB_VPN_AUTH_SERVER : AUTH_SERVER;

  const loginUrl = `${server}/authserver/login${
    service ? `?service=${encodeURIComponent(service)}` : ""
  }`;

  const loginPageResponse = await request<string>(loginUrl, {
    redirect: "manual",
  });

  const location = loginPageResponse.headers.get("Location");

  if (loginPageResponse.status === 302)
    return {
      success: true,
      location: location!,
    };

  if (loginPageResponse.status === 200) {
    const content = loginPageResponse.data;

    if (
      content.includes("不允许使用认证服务来认证您访问的目标应用。") ||
      content.includes("不允许访问")
    )
      return {
        success: false,
        type: LoginFailType.Forbidden,
        msg: "用户账号没有此服务权限。",
      };

    const salt = SALT_REGEXP.exec(content)![1];
    const lt = content.match(/name="lt" value="(.*?)"/)![1];
    const dllt = content.match(/name="dllt" value="(.*?)"/)![1];
    const execution = content.match(/name="execution" value="(.*?)"/)![1];
    const _eventId = content.match(/name="_eventId" value="(.*?)"/)![1];
    const rmShown = content.match(/name="rmShown" value="(.*?)"/)![1];

    cookieStore.set({
      name: "org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE",
      value: "zh_CN",
      domain,
    });

    const { data: needCaptcha } = await request<boolean>(
      `${server}/authserver/needCaptcha.html?username=${id}&pwdEncrypt2=pwdEncryptSalt&_=${Date.now()}`,
    );

    if (needCaptcha)
      return {
        success: false,
        type: LoginFailType.NeedCaptcha,
        msg: "需要验证码，请重新登录",
      };

    const {
      data: loginResult,
      headers: loginHeaders,
      status: loginStatus,
    } = await request<string>(loginUrl, {
      method: "POST",
      body: new URLSearchParams({
        username: id.toString(),
        password: authEncrypt(password, salt),
        lt,
        dllt,
        execution,
        _eventId,
        rmShown,
        rememberMe: "on",
      }),
      redirect: "manual",
    });

    const loginLocation = loginHeaders.get("Location");

    console.log(`Request location:`, loginLocation);
    console.log("Login cookies:", cookieStore.getCookiesMap(server));

    if (loginStatus === 200) {
      if (loginResult.includes("您提供的用户名或者密码有误"))
        return {
          success: false,
          type: LoginFailType.WrongPassword,
          msg: "用户名或密码错误",
        };

      if (
        loginResult.includes("该帐号已经被锁定，请点击&ldquo;账号激活&rdquo;")
      )
        return {
          success: false,
          type: LoginFailType.AccountLocked,
          msg: "该帐号已经被锁定，请使用小程序的“账号激活”功能",
        };

      if (
        loginResult.includes(
          "当前存在其他用户使用同一帐号登录，是否注销其他使用同一帐号的用户。",
        )
      )
        return {
          success: false,
          type: LoginFailType.EnabledSSO,
          msg: "您已开启单点登录，请访问学校统一身份认证官网，在个人设置中关闭单点登录后重试。",
        };

      if (loginResult.includes("请输入验证码"))
        return {
          success: false,
          type: LoginFailType.NeedCaptcha,
          // TODO: Update
          msg: "需要验证码，无法自动登录。请访问学校统一身份认证官网手动登录，成功登录后后即可继续自动登录。",
        };

      if (loginResult.includes("不允许使用认证服务来认证您访问的目标应用。"))
        return {
          success: false,
          type: LoginFailType.Forbidden,
          msg: "用户账号没有此服务权限。",
        };

      console.error("Unknown login response: ", loginResult);

      return {
        success: false,
        type: LoginFailType.Unknown,
        msg: "未知错误",
      };
    }

    if (loginStatus === 302) {
      if (loginLocation === `${server}/authserver/login`)
        return {
          success: false,
          type: LoginFailType.WrongPassword,
          msg: "用户名或密码错误",
        };

      return {
        success: true,
        location: loginLocation!,
      };
    }
  }

  console.error("Unknown login response: ", loginPageResponse.status);

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "未知错误",
  };
};

export const authOnlineLogin = async ({
  id,
  password,
}: AccountInfo): Promise<AuthLoginResponse> => {
  const { data } = await request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: { id, password },
    cookieScope: AUTH_SERVER,
  });

  if (!data.success)
    logger.error("登录失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};
