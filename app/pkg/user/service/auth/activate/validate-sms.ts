import { request } from "../../../../../api/index.js";
import type { CommonSuccessResponse } from "../../../../../service/index.js";
import { ActionFailType } from "../../../../../service/index.js";
import { RESET_PREFIX } from "../utils.js";

export interface ActivateValidSmsOptions {
  type: "validate-sms";
  sign: string;
  code: string;
}

interface RawValidSmsSuccessResponse {
  code: "0";
  success: true;
  result: {
    loginNo: string;
    sign: string;
  };
}

interface RawValidSmsFailedResponse {
  code: "0";
  success: false;
  message: string;
  messages: string;
  result: null;
}

type RawValidSmsResponse =
  | RawValidSmsSuccessResponse
  | RawValidSmsFailedResponse;

export type ActivateSuccessResponse = CommonSuccessResponse<{
  loginNo: string;
  sign: string;
}>;

export interface ActivateValidSmsConflictResponse {
  success: false;
  type: ActionFailType.Conflict | ActionFailType.WrongCaptcha;
  msg: string;
}

export type ActivateValidSmsResponse =
  | ActivateSuccessResponse
  | ActivateValidSmsConflictResponse;

export const validateActivateSms = async ({
  sign,
  code,
}: ActivateValidSmsOptions): Promise<ActivateValidSmsResponse> => {
  const { data } = await request<RawValidSmsResponse>(
    `${RESET_PREFIX}/accountActivation/checkValidateCode`,
    {
      method: "POST",
      body: { sign, validateCode: code },
    },
  );

  if (!data.success)
    return {
      success: false,
      type: ActionFailType.WrongCaptcha,
      msg: data.messages,
    };

  return {
    success: true,
    data: data.result,
  };
};
