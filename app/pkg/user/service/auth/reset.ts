import { URLSearchParams, encodeBase64 } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import { AUTH_SERVER, createService } from "../../../../service/index.js";

const RESET_PASSWORD_PAGE_URL = `${AUTH_SERVER}/authserver/getBackPasswordMainPage.do`;
const RESET_PASSWORD_URL = `${AUTH_SERVER}/authserver/getBackPassword.do`;
const CAPTCHA_URL = `${AUTH_SERVER}/authserver/captcha.html`;

export interface ResetPasswordCaptchaOptions {
  type: "captcha";
}

interface RawFailedData {
  success: false;
  data: Record<never, never>;
  code: number;
  message: string;
}

export interface ResetPasswordCaptchaResponse {
  success: true;
  captcha: string;
}

const getResetPasswordCaptchaLocal = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: ResetPasswordCaptchaOptions,
): Promise<ResetPasswordCaptchaResponse> => {
  await request<ArrayBuffer>(RESET_PASSWORD_PAGE_URL);

  const { data: captchaResponse } = await request<ArrayBuffer>(
    `${CAPTCHA_URL}?ts=${new Date().getMilliseconds()}`,
    { responseType: "arraybuffer" },
  );

  const base64Image = `data:image/jpeg;base64,${encodeBase64(captchaResponse)}`;

  return {
    success: true,
    captcha: base64Image,
  };
};

type RawResetPasswordInfoData =
  | {
      success: true;
      code: 0;
      message: null;
      data: {
        sign: string;
        question: unknown;
        uid: string;
      };
    }
  | RawFailedData;

export interface ResetPasswordPhoneOptions {
  type: "verify-phone";
  id: string;
  mobile: string;
  captcha: string;
}

export interface ResetPasswordPhoneSuccessResponse {
  success: true;
  sign: string;
}

export type ResetPasswordPhoneResponse =
  | ResetPasswordPhoneSuccessResponse
  | CommonFailedResponse;

const verifySecurityPhoneLocal = async ({
  id,
  mobile,
  captcha,
}: ResetPasswordPhoneOptions): Promise<ResetPasswordPhoneResponse> => {
  const { data } = await request<RawResetPasswordInfoData>(RESET_PASSWORD_URL, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    body: new URLSearchParams({
      userId: id,
      mobile,
      captcha,
      type: "mobile",
      step: "1",
    }),
  });

  if (data.success)
    return {
      success: true,
      sign: data.data.sign,
    };

  return {
    success: false,
    msg: data.message,
  };
};

export interface ResetPasswordSendSMSOptions {
  type: "send-sms";
  /** 学号 */
  id: string;
  /** 手机号 */
  mobile: string;
  sign: string;
}

type RawResetPasswordSendSMSData =
  | {
      success: true;
      code: 0;
      message: null;
      data: {
        sign: string;
        msgTip: string;
      };
    }
  | RawFailedData;

export interface ResetPasswordSendSMSSuccessResponse {
  success: true;
  sign: string;
}

export type ResetPasswordSendSMSResponse =
  | ResetPasswordSendSMSSuccessResponse
  | CommonFailedResponse;

const sendResetPasswordSMSLocal = async ({
  id,
  mobile,
  sign,
}: ResetPasswordSendSMSOptions): Promise<ResetPasswordSendSMSResponse> => {
  const { data } = await request<RawResetPasswordSendSMSData>(
    RESET_PASSWORD_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        userId: id,
        mobile,
        sign,
        type: "mobile",
        step: "2",
      }),
    },
  );

  if (data.success)
    return {
      success: true,
      sign: data.data.sign,
    };

  return {
    success: false,
    msg: data.message,
  };
};

export interface ResetPasswordVerifySMSOptions {
  type: "verify-sms";
  /** 学号 */
  id: string;
  /** 手机号 */
  mobile: string;
  /** 验证码 */
  code: string;
  sign: string;
}

type RawResetPasswordVerifySMSData =
  | {
      success: true;
      code: 0;
      message: null;
      data: {
        sign: string;
        passwordPolicy: string;
        pwdDefaultEncryptSalt: string;
      };
    }
  | RawFailedData;

export interface ResetPasswordVerifySMSSuccessResponse {
  success: true;
  sign: string;
  salt: string;
}

export type ResetPasswordVerifySMSResponse =
  | ResetPasswordVerifySMSSuccessResponse
  | CommonFailedResponse;

const verifyResetPasswordSMSCodeLocal = async ({
  id,
  mobile,
  code,
  sign,
}: ResetPasswordVerifySMSOptions): Promise<ResetPasswordVerifySMSResponse> => {
  const { data } = await request<RawResetPasswordVerifySMSData>(
    RESET_PASSWORD_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        userId: id,
        mobile,
        code,
        sign,
        type: "mobile",
        step: "3",
      }),
    },
  );

  if (data.success)
    return {
      success: true,
      sign: data.data.sign,
      salt: data.data.pwdDefaultEncryptSalt,
    };

  return {
    success: false,
    msg: data.message,
  };
};

export interface ResetPasswordSetNewOptions {
  type: "set";
  /** 学号 */
  id: string;
  /** 手机号 */
  mobile: string;
  /** 验证码 */
  code: string;
  password: string;
  salt: string;
  sign: string;
}

type RawResetPasswordSetNewData =
  | {
      success: true;
      code: 0;
      message: null;
      data: {
        sign: string;
      };
    }
  | RawFailedData;

export interface ResetPasswordSetNewSuccessResponse {
  success: true;
}

export type ResetPasswordSetNewResponse =
  | ResetPasswordSetNewSuccessResponse
  | CommonFailedResponse;

const setNewPasswordLocal = async ({
  id,
  mobile,
  code,
  password,
  salt,
  sign,
}: ResetPasswordSetNewOptions): Promise<ResetPasswordSetNewResponse> => {
  const { data: encryptResult } = await request<{
    data: string;
    success: true;
  }>("/auth/encrypt", {
    method: "POST",
    body: { password, salt },
  });

  const { data } = await request<RawResetPasswordSetNewData>(
    RESET_PASSWORD_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        userId: id,
        mobile,
        code,
        birthday: "null",
        answer: "null",
        sign,
        password: encryptResult.data,
        confirmPassword: encryptResult.data,
        type: "mobile",
        step: "4",
      }),
    },
  );

  if (data.success)
    return {
      success: true,
    };

  return {
    success: false,
    msg: data.message,
  };
};

export type ResetPasswordOptions =
  | ResetPasswordCaptchaOptions
  | ResetPasswordPhoneOptions
  | ResetPasswordSendSMSOptions
  | ResetPasswordVerifySMSOptions
  | ResetPasswordSetNewOptions;

export type ResetPasswordResponse<T extends ResetPasswordOptions> =
  T extends ResetPasswordCaptchaOptions
    ? ResetPasswordCaptchaResponse
    : T extends ResetPasswordPhoneOptions
      ? ResetPasswordPhoneResponse
      : T extends ResetPasswordSendSMSOptions
        ? ResetPasswordSendSMSResponse
        : T extends ResetPasswordVerifySMSOptions
          ? ResetPasswordVerifySMSResponse
          : ResetPasswordSetNewResponse;

const resetPasswordLocal = async <T extends ResetPasswordOptions>(
  options: T,
): Promise<ResetPasswordResponse<T>> =>
  (options.type === "captcha"
    ? getResetPasswordCaptchaLocal(options)
    : options.type === "verify-phone"
      ? verifySecurityPhoneLocal(options)
      : options.type === "send-sms"
        ? sendResetPasswordSMSLocal(options)
        : options.type === "verify-sms"
          ? verifyResetPasswordSMSCodeLocal(options)
          : setNewPasswordLocal(options)) as Promise<ResetPasswordResponse<T>>;

const resetPasswordOnline = async <T extends ResetPasswordOptions>(
  options: T,
): Promise<ResetPasswordResponse<T>> =>
  request<ResetPasswordResponse<T>>("/auth/reset", {
    method: options.type === "captcha" ? "GET" : "POST",
    ...(options.type === "captcha" ? {} : { body: options }),
    cookieScope: `${AUTH_SERVER}/authserver/`,
  }).then(({ data }) => data);

export const resetPassword = createService(
  "reset-password",
  resetPasswordLocal,
  resetPasswordOnline,
);
