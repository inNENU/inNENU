import { URLSearchParams } from "@mptool/all";

import { RE_AUTH_URL } from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  AUTH_COOKIE_SCOPE,
  AUTH_SERVER,
  ActionFailType,
  UnknownResponse,
  createService,
} from "../../../../service/index.js";

const RE_AUTH_SMS_URL = `${AUTH_SERVER}/authserver/dynamicCode/getDynamicCodeByReauth.do`;

interface RawReAuthSMSSuccessResponse {
  res: "success";
  mobile: string;
  returnMessage: string;
  codeTime: number;
}

interface RawReAuthSMSFrequentResponse {
  res: "code_time_fail";
  codeTime: number;
  returnMessage: string;
}

interface RawReAuthSMSFailResponse {
  res: `${string}_fail`;
  codeTime: number;
  returnMessage: string;
}

type RawReAuthSMSResponse =
  | RawReAuthSMSSuccessResponse
  | RawReAuthSMSFrequentResponse
  | RawReAuthSMSFailResponse;

export type ReAuthSMSResponse =
  | CommonSuccessResponse<{
      /** 下一个验证码的间隔秒数 */
      codeTime: number;
      /** 手机号 */
      hiddenCellphone: string;
    }>
  | (CommonFailedResponse<ActionFailType.TooFrequent> & { codeTime: number })
  | CommonFailedResponse<ActionFailType.Unknown>;

export const sendReAuthSMSLocal = async (
  id: string,
): Promise<ReAuthSMSResponse> => {
  await request(RE_AUTH_URL);

  const { data } = await request<RawReAuthSMSResponse>(RE_AUTH_SMS_URL, {
    method: "POST",
    body: new URLSearchParams({
      userName: id,
      authCodeTypeName: "reAuthDynamicCodeType",
    }),
  });

  if (data.res === "code_time_fail")
    return {
      success: false,
      type: ActionFailType.TooFrequent,
      msg: data.returnMessage,
      codeTime: data.codeTime,
    };

  if (data.res !== "success") return UnknownResponse(data.returnMessage);

  return {
    success: true,
    data: {
      codeTime: data.codeTime,
      hiddenCellphone: data.mobile,
    },
  };
};

const sendReAuthSMSOnline = async (id: string): Promise<ReAuthSMSResponse> =>
  request<ReAuthSMSResponse>(`/auth/re-auth?id=${id}`, {
    cookieScope: AUTH_COOKIE_SCOPE,
  }).then(({ data }) => data);

export const sendReAuthSMS = createService(
  "re-auth",
  sendReAuthSMSLocal,
  sendReAuthSMSOnline,
);

const RE_AUTH_VERIFY_URL = `${AUTH_SERVER}/authserver/reAuthCheck/reAuthSubmit.do`;

interface RawVerifyReAuthCaptchaResponse {
  code: "reAuth_success" | "reAuth_failed";
  msg: string;
}

export interface VerifyReAuthCaptchaSuccessResponse {
  success: true;
  authToken: string;
}

export type VerifyReAuthCaptchaResponse =
  | VerifyReAuthCaptchaSuccessResponse
  | CommonFailedResponse;

const verifyReAuthCaptchaLocal = async (
  smsCode: string,
): Promise<VerifyReAuthCaptchaResponse> => {
  const { data } = await request<RawVerifyReAuthCaptchaResponse>(
    RE_AUTH_VERIFY_URL,
    {
      method: "POST",
      body: new URLSearchParams({
        dynamicCode: smsCode,
        service: "",
        reAuthType: "3",
        isMultifactor: "true",
        password: "",
        uuid: "",
        answer1: "",
        answer2: "",
        otpCode: "",
        skipTmpReAuth: "true",
      }),
    },
  );

  if (data.code !== "reAuth_success") return UnknownResponse(data.msg);

  return {
    success: true,
    authToken: cookieStore.getValue("MULTIFACTOR_USERS", {})!,
  };
};

const verifyReAuthCaptchaOnline = async (
  smsCode: string,
): Promise<VerifyReAuthCaptchaResponse> =>
  request<VerifyReAuthCaptchaResponse>("/auth/re-auth", {
    method: "POST",
    body: { smsCode },
    cookieScope: AUTH_COOKIE_SCOPE,
  }).then(({ data }) => data);

export const verifyReAuthCaptcha = createService(
  "re-auth",
  verifyReAuthCaptchaLocal,
  verifyReAuthCaptchaOnline,
);
