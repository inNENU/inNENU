import { URLSearchParams, logger } from "@mptool/all";

import type { AuthCaptchaResponse } from "./captcha.js";
import { getAuthCaptcha } from "./captcha.js";
import { AUTH_LOGIN_URL, RE_AUTH_URL } from "./utils.js";
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
  getMyInfo,
  myLoginLocal,
  supportRedirect,
  vpnLoginLocal,
} from "../../../../service/index.js";
import type { AccountInfo, UserInfo } from "../../../../state/index.js";

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

const getAuthInitInfoLocal = async (
  id: string,
): Promise<AuthInitInfoResponse> => {
  try {
    cookieStore.clear();

    const { data: content } = await request<string>(AUTH_LOGIN_URL);

    const salt = SALT_REGEXP.exec(content)![1];
    const execution = content.match(/name="execution" value="(.*?)"/)![1];

    cookieStore.set({
      name: "org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE",
      value: "zh_CN",
      domain: AUTH_DOMAIN,
    });

    const checkCaptchaLink = `${AUTH_SERVER}/authserver/checkNeedCaptcha.htl?username=${id}&_=${Date.now()}`;

    const { data } = await request<{ isNeed: boolean }>(checkCaptchaLink);
    const needCaptcha = data.isNeed;

    const captchaResponse = needCaptcha ? await getAuthCaptcha(id) : null;

    return {
      success: true,
      needCaptcha,
      captcha: captchaResponse,
      salt,
      params: {
        username: id.toString(),
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
  | ActionFailType.NeedCaptcha
  | ActionFailType.NeedReAuth
  | ActionFailType.Unknown
  | ActionFailType.WrongCaptcha
  | ActionFailType.WrongPassword
>;

export type InitAuthResponse = InitAuthSuccessResponse | InitAuthFailedResponse;

const initAuthLocal = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  if (!supportRedirect) return initAuthOnline(options);

  const { id, password, authToken, salt, params } = options;
  const {
    data: loginContent,
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
    if (loginContent.includes("您提供的用户名或者密码有误"))
      return WrongPasswordResponse;
  } else if (loginStatus === 200) {
    if (loginContent.includes("无效的验证码"))
      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: "验证码错误",
      };

    if (loginContent.includes("您提供的用户名或者密码有误"))
      return WrongPasswordResponse;

    if (loginContent.includes("该帐号已经被锁定，请点击&ldquo;账号激活&rdquo;"))
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: "该帐号已经被锁定，请使用小程序的“账号激活”功能",
      };

    if (loginContent.includes("会话已失效，请刷新页面再登录"))
      return {
        success: false,
        type: ActionFailType.Expired,
        msg: "会话已过期，请重新登陆",
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
        msg: "登录失败，需要验证码",
      };
  }

  if (loginStatus === 302) {
    if (location?.startsWith(AUTH_LOGIN_URL)) return WrongPasswordResponse;

    if (location?.startsWith(RE_AUTH_URL))
      return {
        success: false,
        type: ActionFailType.NeedReAuth,
        msg: "登录失败，需要二次认证",
      };

    let info: UserInfo | null = null;

    let loginResult = await myLoginLocal({ id, password, authToken });

    if (
      "type" in loginResult &&
      loginResult.type === ActionFailType.Forbidden
    ) {
      // Activate VPN by login
      const vpnLoginResult = await vpnLoginLocal({ id, password, authToken });

      if (vpnLoginResult.success)
        loginResult = await myLoginLocal({ id, password, authToken });
      else logger.error("VPN login failed", vpnLoginResult);
    }

    // 获得信息
    if (loginResult.success) {
      const studentInfo = await getMyInfo();

      if (studentInfo.success) info = studentInfo.data;

      logger.debug(`${id} 登录信息:\n`, JSON.stringify(info, null, 2));
    }

    // TODO: Add blacklist
    // if (isInBlackList(id, openid, info))
    //   return {
    //     success: false,
    //     type: ActionFailType.BlackList,
    //     msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
    //   };

    return {
      success: true,
      info,
    };
  }

  logger.error("Unknown login response: ", loginContent);

  return UnknownResponse("登录失败");
};

const initAuthOnline = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  const { data: result } = await request<InitAuthResponse>("/auth/init", {
    method: "POST",
    body: options,
    cookieScope: AUTH_COOKIE_SCOPE,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const initAuth = createService(
  "init-auth",
  initAuthLocal,
  initAuthOnline,
);
