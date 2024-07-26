import type { RichTextNode } from "@mptool/all";
import { encodeBase64, getRichTextNodes } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import {
  AUTH_SERVER,
  ActionFailType,
  RestrictedResponse,
  UnknownResponse,
  authEncrypt,
  createService,
} from "../../../../service/index.js";
import { generateRandomString } from "../../utils/index.js";

const CAPTCHA_URL = `${AUTH_SERVER}/retrieve-password/generateCaptcha`;
const LICENSE_TEXT = `
<ol><li>在使用统一身份认证系统登录前，请确保完成账号激活流程。</li><li>在激活过程中，您需设置符合强密码要求的密码。</li><li>为完成激活，系统将采集您的手机号、邮箱等个人信息，以用于信息通知、密码找回及安全验证等场景。</li><li>激活成功后，您可使用 "学工号" 和所设置的密码，登录统一身份认证系统。</li><li>如在激活过程中遇到问题，请及时联系管理员</li></ol>`;
const INFO_SALT = "rjBFAaHsNkKAhpoi";

export const ID_TYPES = [
  "身份证",
  "护照",
  "港澳居民来往内地通行证",
  "旅行证据",
  "其他",
] as const;

export interface ActivateSuccessResponse {
  success: true;
}

export interface ActivateInitOptions {
  type: "init";
}

export interface ActivateInitSuccessResponse {
  success: true;
  captcha: string;
  captchaId: string;
  license: RichTextNode[];
}

export type ActivateInitResponse =
  | ActivateInitSuccessResponse
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

const init = async (): Promise<ActivateInitResponse> => {
  const LICENSE_NODES = await getRichTextNodes(LICENSE_TEXT);
  const captchaId = generateRandomString(16);
  const { data: imageContent, headers } = await request<ArrayBuffer>(
    `${CAPTCHA_URL}?ltId=${captchaId}&codeType=2`,
    { responseType: "arraybuffer" },
  );

  if (headers.get("Content-Type") === "text/html") return RestrictedResponse;
  if (!headers.get("Content-Type")?.startsWith("image/jpeg"))
    return UnknownResponse("获取验证码失败");

  return {
    success: true,
    captcha: `data:image/jpeg;base64,${encodeBase64(imageContent)}`,
    captchaId,
    license: LICENSE_NODES,
  };
};

export interface ActivateValidOptions {
  type: "valid";
  name: string;
  schoolId: string;
  idType: number;
  id: string;
  captcha: string;
  captchaId: string;
}

interface ActivateRawSuccessResponse {
  code: 0;
  msg: "成功";
  data: {
    activationId: string;
  };
}

interface RawErrorResponse {
  code: 20002;
  msg: string;
  data: Record<never, never>;
}

export interface ActivateValidSuccessResponse {
  success: true;
  activationId: string;
}

export type ActivateValidResponse =
  | ActivateValidSuccessResponse
  | CommonFailedResponse;

const validInfo = async ({
  schoolId,
  captchaId,
  name,
  id,
  idType,
  captcha,
}: ActivateValidOptions): Promise<ActivateValidResponse> => {
  const { data: activateResult } = await request<
    ActivateRawSuccessResponse | RawErrorResponse
  >(
    `${AUTH_SERVER}/retrieve-password/accountActivation/queryAccountByLoginNoAndId`,
    {
      method: "POST",
      body: {
        loginNo: schoolId,
        loginName: name,
        captcha,
        captchaId,
        idType,
        idNo: authEncrypt(id, INFO_SALT),
      },
    },
  );

  if (activateResult.code !== 0) return UnknownResponse(activateResult.msg);

  const { activationId } = activateResult.data;

  return {
    success: true,
    activationId,
  };
};

interface CodeRawSuccessResponse {
  code: 0;
  msg: "成功";
  data: Record<never, never>;
}

// TODO: Check this

interface CodeRawFailedResponse {
  code: number;
  msg: string;
  data: Record<never, never>;
}

export interface ActivatePhoneSmsOptions {
  type: "sms";
  activationId: string;
  mobile: string;
}

export type ActivatePhoneSmsResponse =
  | ActivateSuccessResponse
  | CommonFailedResponse;

const sendSms = async ({
  activationId,
  mobile,
}: ActivatePhoneSmsOptions): Promise<ActivatePhoneSmsResponse> => {
  const { data: sendCodeResult } = await request<
    CodeRawSuccessResponse | CodeRawFailedResponse
  >(`${AUTH_SERVER}/api/staff/activate/checkCode`, {
    method: "POST",
    body: { activationId, mobile },
  });

  if (sendCodeResult.code !== 0) return UnknownResponse(sendCodeResult.msg);

  return { success: true };
};

export interface ActivateBindPhoneOptions {
  type: "bind-phone";
  activationId: string;
  mobile: string;
  code: string;
}

interface RawPhoneSuccessResponse {
  code: 0;
  msg: "成功";
  data: { boundStaffNo: string } | Record<string, string>;
}

export interface ActivateBindPhoneConflictResponse {
  success: false;
  type: ActionFailType.Conflict | ActionFailType.WrongCaptcha;
  msg: string;
}
export type ActivateBindPhoneResponse =
  | ActivateSuccessResponse
  | ActivateBindPhoneConflictResponse;

const bindPhone = async ({
  activationId,
  code,
  mobile,
}: ActivateBindPhoneOptions): Promise<ActivateBindPhoneResponse> => {
  const { data: content } = await request<
    RawPhoneSuccessResponse | RawErrorResponse
  >(`${AUTH_SERVER}/api/staff/activate/mobile`, {
    method: "POST",
    body: { activationId, mobile, checkCode: code },
  });

  if (content.code !== 0)
    return {
      success: false,
      type: ActionFailType.WrongCaptcha,
      msg: content.msg,
    };

  if (content.data.boundStaffNo)
    return {
      success: false,
      type: ActionFailType.Conflict,
      msg: `该手机号已绑定 ${content.data.boundStaffNo} 学号。`,
    };

  return {
    success: true,
  };
};

export interface ActivateReplacePhoneOptions {
  type: "replace-phone";
  activationId: string;
  mobile: string;
  code: string;
}

export type ActivateReplacePhoneResponse =
  | ActivateSuccessResponse
  | CommonFailedResponse;

const replacePhone = async ({
  activationId,
  code,
  mobile,
}: ActivateReplacePhoneOptions): Promise<ActivateReplacePhoneResponse> => {
  const { data: content } = await request<
    RawPhoneSuccessResponse | RawErrorResponse
  >(`${AUTH_SERVER}/api/staff/activate/mobile/unbind`, {
    method: "POST",
    body: { activationId, mobile, checkCode: code },
  });

  if (content.code !== 0) return UnknownResponse(content.msg);

  return {
    success: true,
  };
};

export interface ActivatePasswordOptions {
  type: "password";
  activationId: string;
  password: string;
}

export type ActivatePasswordResponse =
  | ActivateSuccessResponse
  | CommonFailedResponse;

const setPassword = async ({
  activationId,
  password,
}: ActivatePasswordOptions): Promise<ActivatePasswordResponse> => {
  const { data: content } = await request<
    ActivateRawSuccessResponse | RawErrorResponse
  >(`${AUTH_SERVER}/api/staff/activate/password`, {
    method: "POST",
    body: { activationId, password },
  });

  if (content.code !== 0) return UnknownResponse(content.msg);

  return {
    success: true,
  };
};

export type ActivateOptions =
  | ActivateInitOptions
  | ActivateValidOptions
  | ActivatePhoneSmsOptions
  | ActivateBindPhoneOptions
  | ActivateReplacePhoneOptions
  | ActivatePasswordOptions;

export type ActiveResponse<T extends ActivateOptions> =
  T extends ActivateInitOptions
    ? ActivateInitResponse
    : T extends ActivateValidOptions
      ? ActivateValidResponse
      : T extends ActivatePhoneSmsOptions
        ? ActivatePhoneSmsResponse
        : T extends ActivateBindPhoneOptions
          ? ActivateBindPhoneResponse
          : T extends ActivateReplacePhoneOptions
            ? ActivateReplacePhoneResponse
            : ActivatePasswordResponse;

const activeAccountLocal = async <T extends ActivateOptions>(
  options: T,
): Promise<ActiveResponse<T>> =>
  (options.type === "init"
    ? init()
    : options.type === "valid"
      ? validInfo(options)
      : options.type === "sms"
        ? sendSms(options)
        : options.type === "bind-phone"
          ? bindPhone(options)
          : options.type === "replace-phone"
            ? replacePhone(options)
            : setPassword(options)) as Promise<ActiveResponse<T>>;

const activateAccountOnline = async <T extends ActivateOptions>(
  options: T,
): Promise<ActiveResponse<T>> =>
  request<ActiveResponse<T>>("/auth/activate", {
    method: options.type === "init" ? "GET" : "POST",
    ...(options.type === "init" ? {} : { body: options }),
    cookieScope: `${AUTH_SERVER}/api/`,
  }).then(({ data }) => data);

export const activateAccount: <T extends ActivateOptions>(
  options: T,
) => Promise<ActiveResponse<T>> = createService(
  "activate",
  activeAccountLocal,
  activateAccountOnline,
);
