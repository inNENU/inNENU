import { URLSearchParams, logger } from "@mptool/all";

import { authEncrypt } from "./encrypt.js";
import {
  AUTH_COOKIE_SCOPE,
  AUTH_DOMAIN,
  AUTH_SERVER,
  SALT_REGEXP,
  WEB_VPN_AUTH_DOMAIN,
  WEB_VPN_AUTH_SERVER,
} from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";
import type { CommonFailedResponse } from "../utils/index.js";
import {
  ActionFailType,
  UnknownResponse,
  WrongPasswordResponse,
  createService,
  supportRedirect,
} from "../utils/index.js";

export interface AuthLoginOptions extends AccountInfo {
  service?: string;
  webVPN?: boolean;
}

export interface AuthLoginSuccessResponse {
  success: true;
  location: string;
}

export type AuthLoginFailedResponse = CommonFailedResponse<
  | ActionFailType.AccountLocked
  | ActionFailType.BlackList
  | ActionFailType.EnabledSSO
  | ActionFailType.Forbidden
  | ActionFailType.Expired
  | ActionFailType.NeedCaptcha
  | ActionFailType.NeedReAuth
  | ActionFailType.WrongPassword
  | ActionFailType.Unknown
>;

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
  | AuthLoginFailedResponse;

const authLoginLocal = async ({
  id,
  password,
  authToken,
  service = "",
  webVPN = false,
}: AuthLoginOptions): Promise<AuthLoginResponse> => {
  // only use local login when redirect is supported
  if (!supportRedirect) return authLoginOnline({ id, password, authToken });

  // TODO: Add black list
  // if (isInBlackList(id))
  //   return {
  //     success: false,
  //     type: ActionFailType.BlackList,
  //     msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
  //   };

  const domain = webVPN ? WEB_VPN_AUTH_DOMAIN : AUTH_DOMAIN;
  const server = webVPN ? WEB_VPN_AUTH_SERVER : AUTH_SERVER;

  // clear auth cookies
  cookieStore.clear(domain);

  const url = `${server}/authserver/login${
    service ? `?service=${encodeURIComponent(service)}` : ""
  }`;

  const {
    data: loginPageContent,
    headers: loginPageHeaders,
    status: loginPageStatus,
  } = await request<string>(url, {
    redirect: "manual",
  });

  const location = loginPageHeaders.get("Location");

  if (loginPageStatus === 302) {
    if (
      location?.startsWith(`${server}/authserver/reAuthCheck/reAuthSubmit.do`)
    )
      return {
        success: false,
        type: ActionFailType.NeedReAuth,
        msg: "需要二次认证，请重新登录",
      };

    return {
      success: true,
      location: location!,
    };
  }

  if (loginPageStatus === 200) {
    if (
      loginPageContent.includes("不允许使用认证服务来认证您访问的目标应用。") ||
      loginPageContent.includes("不允许访问")
    )
      return {
        success: false,
        type: ActionFailType.Forbidden,
        msg: "用户账号没有此服务权限。",
      };

    const salt = SALT_REGEXP.exec(loginPageContent)![1];
    const execution = /name="execution" value="(.*?)"/.exec(
      loginPageContent,
    )![1];

    cookieStore.set({
      name: "org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE",
      value: "zh_CN",
      domain,
    });

    const checkCaptchaLink = `${server}/authserver/checkNeedCaptcha.htl?username=${id}&_=${Date.now()}`;

    const { data } = await request<{ isNeed: boolean }>(checkCaptchaLink);
    const needCaptcha = data.isNeed;

    if (needCaptcha)
      return {
        success: false,
        type: ActionFailType.NeedCaptcha,
        msg: "需要验证码，请重新登录",
      };

    const {
      data: loginContent,
      headers: loginHeaders,
      status: loginStatus,
    } = await request<string>(url, {
      method: "POST",
      body: new URLSearchParams({
        username: id.toString(),
        password: authEncrypt(password, salt),
        lt: "",
        cllt: "usernameLogin",
        dllt: "generalLogin",
        execution,
        _eventId: "submit",
        rememberMe: "true",
      }),
      redirect: "manual",
    });

    const location = loginHeaders.get("Location");

    if (loginStatus === 401) {
      if (loginContent.includes("您提供的用户名或者密码有误"))
        return WrongPasswordResponse;
    } else if (loginStatus === 200) {
      if (loginContent.includes("会话已失效，请刷新页面再登录"))
        return {
          success: false,
          type: ActionFailType.Expired,
          msg: "会话已过期，请重新登陆",
        };

      if (
        loginContent.includes("该帐号已经被锁定，请点击&ldquo;账号激活&rdquo;")
      )
        return {
          success: false,
          type: ActionFailType.AccountLocked,
          msg: "该帐号已经被锁定，请使用小程序的“账号激活”功能",
        };

      if (
        loginContent.includes(
          "当前存在其他用户使用同一帐号登录，是否注销其他使用同一帐号的用户。",
        )
      )
        return {
          success: false,
          type: ActionFailType.EnabledSSO,
          msg: "您已开启单点登录，请访问学校统一身份认证官网，在个人设置中关闭单点登录后重试。",
        };

      if (loginContent.includes("<span>请输入验证码</span>"))
        return {
          success: false,
          type: ActionFailType.NeedCaptcha,
          msg: "需要验证码，请重新登录。",
        };

      if (loginContent.includes("不允许使用认证服务来认证您访问的目标应用。"))
        return {
          success: false,
          type: ActionFailType.Forbidden,
          msg: "用户账号没有此服务权限。",
        };

      console.error("Unknown login response: ", loginContent);

      return UnknownResponse("未知错误");
    }

    if (loginStatus === 302) {
      if (location?.startsWith(`${server}/authserver/login`))
        return WrongPasswordResponse;

      return {
        success: true,
        location: location!,
      };
    }
  }

  logger.error("Unknown login response: ", loginPageStatus);

  return UnknownResponse("未知错误");
};

const authLoginOnline = async (
  options: AuthLoginOptions,
): Promise<AuthLoginResponse> => {
  const { data } = await request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: options,
    cookieScope: AUTH_COOKIE_SCOPE,
  });

  if (!data.success)
    logger.error("登录失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};

export const authLogin = createService(
  "auth-login",
  authLoginLocal,
  authLoginOnline,
);
