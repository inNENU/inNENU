import { URLSearchParams, logger } from "@mptool/all";

import type { AuthCaptchaResponse } from "./captcha.js";
import { getAuthCaptchaLocal } from "./captcha.js";
import {
  AUTH_LOGIN_URL,
  IMPROVE_INFO_URL,
  RE_AUTH_URL,
  UPDATE_INFO_URL,
} from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import {
  AUTH_COOKIE_SCOPE,
  AUTH_DOMAIN,
  AUTH_SERVER,
  ActionFailType,
  SALT_REGEXP,
  UnknownResponse,
  WrongPasswordResponse,
  authEncrypt,
  createService,
  supportRedirect,
} from "../../../../service/index.js";
import type { AccountInfo, UserInfo } from "../../../../state/index.js";
import { appId } from "../../../../state/index.js";

export type AuthInitInfoSuccessResponse = {
  success: true;
  salt: string;
  params: Record<string, string>;
} & (
  | { needCaptcha: true; captcha: AuthCaptchaResponse }
  | { needCaptcha: false; captcha: null }
);

export type AuthInitInfoResponse =
  | AuthInitInfoSuccessResponse
  | CommonFailedResponse;

/**
 * FIXME: This function is now outdated
 */
const getAuthInitInfoLocal = async (
  id: string,
): Promise<AuthInitInfoResponse> => {
  try {
    cookieStore.clear();

    const { data: content } = await request<string>(AUTH_LOGIN_URL);

    const salt = SALT_REGEXP.exec(content)![1];
    const execution = /name="execution" value="(.*?)"/.exec(content)![1];

    cookieStore.set({
      name: "org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE",
      value: "zh_CN",
      domain: AUTH_DOMAIN,
    });

    const checkCaptchaLink = `${AUTH_SERVER}/authserver/checkNeedCaptcha.htl?username=${id}&_=${Date.now()}`;

    const { data } = await request<{ isNeed: boolean }>(checkCaptchaLink);
    const needCaptcha = data.isNeed;

    const captchaResponse = needCaptcha ? await getAuthCaptchaLocal(id) : null;

    return {
      success: true,
      needCaptcha,
      captcha: captchaResponse,
      salt,
      params: {
        username: id,
        lt: "",
        cllt: "usernameLogin",
        dllt: "generalLogin",
        execution,
        _eventId: "submit",
        rememberMe: "true",
      },
    } as AuthInitInfoSuccessResponse;
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

const getAuthInitInfoOnline = async (
  id: string,
): Promise<AuthInitInfoResponse> => {
  cookieStore.clear();

  const { data: result } = await request<AuthInitInfoResponse>(
    `/auth/init?id=${id}`,
    { cookieScope: AUTH_COOKIE_SCOPE },
  );

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const getAuthInitInfo = createService(
  "auth-init-info",
  getAuthInitInfoLocal,
  getAuthInitInfoOnline,
);

export interface InitAuthOptions extends AccountInfo {
  params: Record<string, string>;
  salt: string;
  openid: string;
  appId: string | number;
}

export interface InitAuthSuccessResponse {
  success: true;
  info: UserInfo | null;
}

export type InitAuthFailedResponse = CommonFailedResponse<
  | ActionFailType.AccountLocked
  | ActionFailType.BlackList
  | ActionFailType.EnabledSSO
  | ActionFailType.Expired
  | ActionFailType.Forbidden
  | ActionFailType.NeedCaptcha
  | ActionFailType.NeedReAuth
  | ActionFailType.Unknown
  | ActionFailType.SecurityError
  | ActionFailType.WrongCaptcha
  | ActionFailType.WrongPassword
>;

export type InitAuthResponse = InitAuthSuccessResponse | InitAuthFailedResponse;

/**
 * FIXME: This function is now outdated
 */
const authInitLocal = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  if (!supportRedirect) return authInitOnline(options);

  const { password, salt, params } = options;
  const {
    data: content,
    headers: loginHeaders,
    status: loginStatus,
  } = await request<string>(AUTH_LOGIN_URL, {
    method: "POST",
    body: new URLSearchParams({
      ...params,
      password: authEncrypt(password, salt),
    }),
    redirect: "manual",
  });

  const location = loginHeaders.get("Location");

  if (loginStatus === 401) {
    if (
      content.includes("该账号非常用账号或用户名密码有误") ||
      content.includes("您提供的用户名或者密码有误")
    )
      return WrongPasswordResponse;

    if (content.includes("该帐号未激活，请先完成帐号激活再登录"))
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: "该帐号未激活，请先完成帐号激活再登录",
      };

    if (content.includes("图形动态码错误"))
      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: "图形动态码错误，请重试",
      };

    if (content.includes("该帐号已经被禁用"))
      return {
        success: false,
        type: ActionFailType.Forbidden,
        msg: "该帐号已经被禁用",
      };

    const lockedResult = /<span>账号已冻结，预计解冻时间：(.*?)<\/span>/.exec(
      content,
    );

    if (lockedResult)
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: `账号已冻结，预计解冻时间：${lockedResult[1]}`,
      };

    console.error("Unknown login response: ", loginStatus, content);

    return UnknownResponse("未知错误");
  }

  if (loginStatus === 200) {
    if (content.includes("无效的验证码"))
      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: "验证码错误",
      };

    if (content.includes("会话已失效，请刷新页面再登录"))
      return {
        success: false,
        type: ActionFailType.Expired,
        msg: "会话已过期，请重新登录",
      };

    if (
      content.includes(
        "当前存在其他用户使用同一帐号登录，是否注销其他使用同一帐号的用户。",
      )
    )
      return {
        success: false,
        type: ActionFailType.EnabledSSO,
        msg: "您已开启单点登录，请访问学校统一身份认证官网，在个人设置中关闭单点登录后重试。",
      };

    if (content.includes("<span>请输入验证码</span>"))
      return {
        success: false,
        type: ActionFailType.NeedCaptcha,
        msg: "登录失败，需要验证码",
      };
  }

  if (loginStatus === 302) {
    if (location?.startsWith(AUTH_LOGIN_URL)) return WrongPasswordResponse;

    if (location?.startsWith(IMPROVE_INFO_URL)) {
      const { data } = await request<{ errMsg: string }>(UPDATE_INFO_URL, {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
      });

      return {
        success: false,
        type: ActionFailType.SecurityError,
        msg: data.errMsg ?? "密码太弱，请手动修改密码",
      };
    }

    if (location?.startsWith(RE_AUTH_URL))
      return {
        success: false,
        type: ActionFailType.NeedReAuth,
        msg: "登录失败，需要二次认证",
      };

    // TODO: Add blacklist and user info
    // if (isInBlackList(id, openid, info))
    //   return {
    //     success: false,
    //     type: ActionFailType.BlackList,
    //     msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
    //   };

    return {
      success: true,
      info: null,
    };
  }

  logger.error("Unknown login response: ", loginStatus, content);

  return UnknownResponse("登录失败");
};

const authInitOnline = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  const { data: result } = await request<InitAuthResponse>("/auth/init", {
    method: "POST",
    body: { ...options, appId },
    cookieScope: AUTH_COOKIE_SCOPE,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const authInit = createService(
  "auth-init",
  authInitLocal,
  authInitOnline,
);
