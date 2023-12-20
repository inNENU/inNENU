import { encodeBase64, query } from "@mptool/all";

import type {
  RawResetPasswordInfoData,
  RawResetPasswordSendSMSData,
  RawResetPasswordSetData,
  RawResetPasswordVerifySMSData,
  ResetPasswordCaptchaResponse,
  ResetPasswordInfoOptions,
  ResetPasswordInfoResponse,
  ResetPasswordOptions,
  ResetPasswordSendSMSOptions,
  ResetPasswordSendSMSResponse,
  ResetPasswordSetOptions,
  ResetPasswordSetResponse,
  ResetPasswordVerifySMSOptions,
  ResetPasswordVerifySMSResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/info.js";
import { AUTH_SERVER } from "../../login/index.js";

const RESET_PASSWORD_PAGE_URL = `${AUTH_SERVER}/authserver/getBackPasswordMainPage.do`;
const RESET_PASSWORD_URL = `${AUTH_SERVER}/authserver/getBackPassword.do`;
const CAPTCHA_URL = `${AUTH_SERVER}/authserver/captcha.html`;

export const getCaptcha = async (): Promise<ResetPasswordCaptchaResponse> => {
  await request<ArrayBuffer>(RESET_PASSWORD_PAGE_URL);

  const captchaResponse = await request<ArrayBuffer>(
    `${CAPTCHA_URL}?ts=${new Date().getMilliseconds()}`,
    {
      responseType: "arraybuffer",
    },
  );

  const base64Image = `data:image/jpeg;base64,${encodeBase64(captchaResponse)}`;

  return {
    success: true,
    captcha: base64Image,
  };
};

export const verifyAccount = async ({
  id,
  mobile,
  captcha,
}: ResetPasswordInfoOptions): Promise<ResetPasswordInfoResponse> => {
  const data = await request<RawResetPasswordInfoData>(RESET_PASSWORD_URL, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    data: query.stringify({
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

export const sendSMS = async ({
  id,
  mobile,
  sign,
}: ResetPasswordSendSMSOptions): Promise<ResetPasswordSendSMSResponse> => {
  const data = await request<RawResetPasswordSendSMSData>(RESET_PASSWORD_URL, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    data: query.stringify({
      userId: id,
      mobile,
      sign,
      type: "mobile",
      step: "2",
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

export const verifySMS = async ({
  id,
  mobile,
  code,
  sign,
}: ResetPasswordVerifySMSOptions): Promise<ResetPasswordVerifySMSResponse> => {
  const data = await request<RawResetPasswordVerifySMSData>(
    RESET_PASSWORD_URL,
    {
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      data: query.stringify({
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

export const setPassword = async ({
  id,
  mobile,
  code,
  password,
  salt,
  sign,
}: ResetPasswordSetOptions): Promise<ResetPasswordSetResponse> => {
  const encryptResult = await request<{
    data: string;
    success: true;
  }>(`${service}auth/encrypt`, {
    method: "POST",
    data: {
      password,
      salt,
    },
  });

  const data = await request<RawResetPasswordSetData>(RESET_PASSWORD_URL, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    data: query.stringify({
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
  });

  if (data.success)
    return {
      success: true,
    };

  return {
    success: false,
    msg: data.message,
  };
};

export const resetPasswordOnline = async <
  T extends ResetPasswordOptions | "GET",
>(
  options: T,
): Promise<
  T extends "GET"
    ? ResetPasswordCaptchaResponse
    :
        | ResetPasswordInfoResponse
        | ResetPasswordSendSMSResponse
        | ResetPasswordVerifySMSResponse
        | ResetPasswordSetResponse
> =>
  request(`${service}/auth/reset`, {
    method: options === "GET" ? "GET" : "POST",
    ...(options === "GET" ? {} : { data: options }),
    scope: `${AUTH_SERVER}/authserver/`,
  });
