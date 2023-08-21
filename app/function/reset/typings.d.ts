import type { CommonFailedResponse } from "../../../typings/index.js";

export interface ResetPasswordCaptchaResponse {
  success: true;
  captcha: string;
}

export interface RawFailedData {
  success: false;
  data: Record<never, never>;
  code: number;
  message: string;
}

export type RawResetPasswordInfoData =
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

export interface ResetPasswordInfoOptions {
  id: string;
  mobile: string;
  captcha: string;
}

export interface ResetPasswordInfoSuccessResponse {
  success: true;
  sign: string;
}

export type ResetPasswordInfoResponse =
  | ResetPasswordInfoSuccessResponse
  | CommonFailedResponse;

export interface ResetPasswordSendSMSOptions {
  /** 学号 */
  id: string;
  /** 手机号 */
  mobile: string;
  sign: string;
}

export type RawResetPasswordSendSMSData =
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

export interface ResetPasswordVerifySMSOptions {
  /** 学号 */
  id: string;
  /** 手机号 */
  mobile: string;
  /** 验证码 */
  code: string;
  sign: string;
}

export type RawResetPasswordVerifySMSData =
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

export interface ResetPasswordSetOptions {
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

export type RawResetPasswordSetData =
  | {
      success: true;
      code: 0;
      message: null;
      data: {
        sign: string;
      };
    }
  | RawFailedData;

export interface ResetPasswordSetSuccessResponse {
  success: true;
}

export type ResetPasswordSetResponse =
  | ResetPasswordSetSuccessResponse
  | CommonFailedResponse;

export type ResetPasswordOptions =
  | ResetPasswordInfoOptions
  | ResetPasswordSendSMSOptions
  | ResetPasswordVerifySMSOptions
  | ResetPasswordSetOptions;
