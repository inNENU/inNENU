import { URLSearchParams, encodeBase64, logger } from "@mptool/all";

import { authEncrypt } from "./encrypt.js";
import { AUTH_DOMAIN, AUTH_SERVER, SALT_REGEXP } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/response.js";
import { cookieStore, request } from "../../api/index.js";
import { AccountInfo, UserInfo } from "../../utils/typings.js";
import { LoginFailType } from "../loginFailTypes.js";
import { getMyInfo } from "../my/info.js";
import { myLogin } from "../my/login.js";
import { supportRedirect } from "../utils.js";
import { vpnLogin } from "../vpn/login.js";

const LOGIN_URL = `${AUTH_SERVER}/authserver/login`;

const getCaptcha = async (): Promise<string> => {
  const { data: captcha } = await request<ArrayBuffer>(
    `${AUTH_SERVER}/authserver/captcha.html?ts=${Date.now()}`,
    { responseType: "arraybuffer" },
  );

  return `data:image/jpeg;base64,${encodeBase64(captcha)}`;
};

export interface AuthInitInfoSuccessResponse {
  success: true;
  needCaptcha: boolean;
  captcha: string;
  params: Record<string, string>;
  salt: string;
}

export type AuthInitFailedResponse = CommonFailedResponse;

export type AuthInitInfoResponse =
  | AuthInitInfoSuccessResponse
  | AuthInitFailedResponse;

export const authInitInfo = async (
  id: string,
): Promise<AuthInitInfoResponse> => {
  try {
    const loginPageResponse = await request<string>(LOGIN_URL);

    const content = loginPageResponse.data;

    const salt = SALT_REGEXP.exec(content)![1];
    const lt = content.match(/name="lt" value="(.*?)"/)![1];
    const dllt = content.match(/name="dllt" value="(.*?)"/)![1];
    const execution = content.match(/name="execution" value="(.*?)"/)![1];
    const _eventId = content.match(/name="_eventId" value="(.*?)"/)![1];
    const rmShown = content.match(/name="rmShown" value="(.*?)"/)![1];

    cookieStore.set({
      name: "org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE",
      value: "zh_CN",
      domain: AUTH_DOMAIN,
    });

    const { data: needCaptcha } = await request<boolean>(
      `${AUTH_SERVER}/authserver/needCaptcha.html?username=${id}&pwdEncrypt2=pwdEncryptSalt&_=${Date.now()}`,
    );

    const captcha = needCaptcha ? await getCaptcha() : null;

    return <AuthInitInfoSuccessResponse>{
      success: true,
      needCaptcha,
      captcha,
      cookieStore,
      salt,
      params: {
        username: id.toString(),
        lt,
        dllt,
        execution,
        _eventId,
        rmShown,
        rememberMe: "on",
      },
    };
  } catch (err) {
    logger.error(err);

    return {
      success: false,
      msg: (<Error>err).message,
    };
  }
};

export interface InitAuthOptions extends AccountInfo {
  params: Record<string, string>;
  salt: string;
  captcha: string;
  openid: string;
}

export interface InitAuthSuccessResponse {
  success: true;
  info: UserInfo | null;
}

export interface InitAuthFailedResponse extends CommonFailedResponse {
  type: LoginFailType;
}

export type InitAuthResponse = InitAuthSuccessResponse | InitAuthFailedResponse;

export const initAuth = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  if (!supportRedirect) return onlineInitAuth(options);

  const { id, password, salt, captcha, params } = options;

  const loginResponse = await request<string>(LOGIN_URL, {
    method: "POST",
    body: new URLSearchParams({
      ...params,
      password: authEncrypt(password, salt),
      captchaResponse: captcha,
    }),
    redirect: "manual",
  });

  const location = loginResponse.headers.get("Location");
  const resultContent = loginResponse.data;

  if (loginResponse.status === 200) {
    if (resultContent.includes("无效的验证码"))
      return {
        success: false,
        type: LoginFailType.WrongCaptcha,
        msg: "验证码错误",
      };

    if (resultContent.includes("您提供的用户名或者密码有误"))
      return {
        success: false,
        type: LoginFailType.WrongPassword,
        msg: "用户名或密码错误",
      };

    if (
      resultContent.includes("该帐号已经被锁定，请点击&ldquo;账号激活&rdquo;")
    )
      return {
        success: false,
        type: LoginFailType.AccountLocked,
        msg: "该帐号已经被锁定，请使用小程序的“账号激活”功能",
      };

    if (
      resultContent.includes(
        "当前存在其他用户使用同一帐号登录，是否注销其他使用同一帐号的用户。",
      )
    )
      return {
        success: false,
        type: LoginFailType.EnabledSSO,
        msg: "您已开启单点登录，请访问学校统一身份认证官网，在个人设置中关闭单点登录后重试。",
      };

    if (resultContent.includes("请输入验证码"))
      return {
        success: false,
        type: LoginFailType.NeedCaptcha,
        msg: "需要验证码",
      };
  }

  if (loginResponse.status === 302) {
    if (location === LOGIN_URL)
      return {
        success: false,
        type: LoginFailType.WrongPassword,
        msg: "用户名或密码错误",
      };

    let info: UserInfo | null = null;

    let loginResult = await myLogin({ id, password });

    if ("type" in loginResult && loginResult.type === LoginFailType.Forbidden) {
      // Activate VPN by login
      const vpnLoginResult = await vpnLogin({ id, password });

      if (vpnLoginResult.success) loginResult = await myLogin({ id, password });
      else console.error("VPN login failed", vpnLoginResult);
    }

    // 获得信息
    if (loginResult.success) {
      const studentInfo = await getMyInfo();

      if (studentInfo.success) info = studentInfo.data;

      console.log(`${id} 登录信息:\n`, JSON.stringify(info, null, 2));
    }

    // TODO: Add blacklist
    // if (isInBlackList(id, openid, info))
    //   return {
    //     success: false,
    //     type: LoginFailType.BlackList,
    //     msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
    //   };

    return {
      success: true,
      info,
    };
  }

  console.error("Unknown login response: ", resultContent);

  return {
    success: false,
    type: LoginFailType.Unknown,
    msg: "未知错误",
  };
};

export const onlineAuthInitInfo = async (
  id: string,
): Promise<AuthInitInfoResponse> => {
  const { data: result } = await request<AuthInitInfoResponse>(
    `/auth/init?id=${id}`,
    {
      cookieScope: AUTH_SERVER,
    },
  );

  if (!result.success) logger.error("初始化失败");

  return result;
};

export const onlineInitAuth = async (
  options: InitAuthOptions,
): Promise<InitAuthResponse> => {
  const { data: result } = await request<InitAuthResponse>("/auth/init", {
    method: "POST",
    body: options,
    cookieScope: AUTH_SERVER,
  });

  if (!result.success) logger.error("初始化失败");

  return result;
};
