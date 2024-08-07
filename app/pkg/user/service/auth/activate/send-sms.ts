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
import { getResetCaptchaLocal } from "../reset-captcha.js";
import { RESET_PREFIX, RESET_SALT } from "../utils.js";

interface RawSendSmsSuccessResponse {
  code: "0";
  success: true;
  remainTime: number;
  result: {
    sign: string;
  };
}

interface RawSendSmsFailedResponse {
  code: "0";
  success: false;
  remainTIme: number;
  message: string;
}

type RawSendSmsResponse = RawSendSmsSuccessResponse | RawSendSmsFailedResponse;

export interface ActivateSendSmsOptions {
  type: "send-sms";
  sign: string;
  mobile: string;
  captcha: string;
  captchaId: string;
}

export type ActivateSendSmsSuccessResponse = CommonSuccessResponse<{
  remainTime: number;
  sign: string;
}>;

export type ActivateSendSmsResponse =
  | ActivateSendSmsSuccessResponse
  | (CommonFailedResponse<ActionFailType.WrongCaptcha> & {
      data: ResetCaptchaInfo;
    })
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

export const sendActivateSms = async ({
  sign,
  mobile,
  captcha,
  captchaId,
}: ActivateSendSmsOptions): Promise<ActivateSendSmsResponse> => {
  const { data } = await request<RawSendSmsResponse>(
    `${RESET_PREFIX}/accountActivation/queryValidateCodeByMobile`,
    {
      method: "POST",
      body: {
        sign,
        accountType: 1,
        accountNum: authEncrypt(mobile, RESET_SALT),
        captcha,
        captchaId,
      },
    },
  );

  if (!data.success) {
    if (data.message === "验证码不正确") {
      const captchaResponse = await getResetCaptchaLocal();

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

  return {
    success: true,
    data: {
      remainTime: data.remainTime,
      sign: data.result.sign,
    },
  };
};
