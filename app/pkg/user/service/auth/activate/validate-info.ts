import { INFO_SALT } from "./utils.js";
import { request } from "../../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import {
  ActionFailType,
  UnknownResponse,
  authEncrypt,
} from "../../../../../service/index.js";
import type { ResetCaptchaInfo } from "../reset-captcha.js";
import { getResetCaptcha } from "../reset-captcha.js";
import { RESET_PREFIX } from "../utils.js";

interface RawValidationSuccessResponse {
  success: true;
  code: "0";
  remainTime: number;
  result: {
    sign: string;
    loginNo: string;
  };
}

interface RawValidationFailResponse {
  success: false;
  code: "0";
  remainTime: number;
  result: null;
  message: string;
  messages: string;
}

type RawValidationResponse =
  | RawValidationSuccessResponse
  | RawValidationFailResponse;

export interface ActivateValidationOptions {
  type: "validate-info";
  name: string;
  schoolId: string;
  idType: number;
  id: string;
  captcha: string;
  captchaId: string;
}

export type ActivateValidationSuccessResponse = CommonSuccessResponse<
  ResetCaptchaInfo & { sign: string; loginNo: string }
>;

export type ActivateValidationResponse =
  | ActivateValidationSuccessResponse
  | (CommonFailedResponse<ActionFailType.WrongCaptcha> & {
      data: ResetCaptchaInfo;
    })
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

export const validAccountInfo = async ({
  schoolId,
  name,
  id,
  idType,
  captcha,
  captchaId,
}: ActivateValidationOptions): Promise<ActivateValidationResponse> => {
  const { data } = await request<RawValidationResponse>(
    `${RESET_PREFIX}/accountActivation/queryAccountByLoginNoAndId`,
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

  if (!data.success) {
    if (data.message === "验证码不正确") {
      const captchaResponse = await getResetCaptcha();

      if (!captchaResponse.success) return captchaResponse;

      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: data.message,
        data: captchaResponse.data,
      };
    }

    return UnknownResponse(data.message);
  }

  const captchaResponse = await getResetCaptcha();

  if (!captchaResponse.success) return captchaResponse;

  return {
    success: true,
    data: {
      ...captchaResponse.data,
      ...data.result,
    },
  };
};
