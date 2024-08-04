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
import { RESET_PREFIX } from "../utils.js";

export interface ActivateCheckPasswordOptions {
  type: "check-password";
  sign: string;
  password: string;
}

interface RawCheckPasswordSuccessResponse {
  code: "0";
  datas: {
    rules: Record<string, boolean>;
  };
  message: "SUCCESS";
}

interface RawCheckPasswordFailResponse {
  code: unknown;
  message: string;
}

type RawCheckPasswordResponse =
  | RawCheckPasswordSuccessResponse
  | RawCheckPasswordFailResponse;

export type ActivateCheckPasswordResponse =
  | CommonSuccessResponse
  | CommonFailedResponse;

export const checkPassword = async ({
  sign,
  password,
}: ActivateCheckPasswordOptions): Promise<ActivateCheckPasswordResponse> => {
  const { data } = await request<RawCheckPasswordResponse>(
    `${RESET_PREFIX}/common/passwordScoreCheck`,
    {
      method: "POST",
      body: {
        password: authEncrypt(password, INFO_SALT),
        operationSource: 3,
        sign,
      },
    },
  );

  if (data.code !== "0" || data.message !== "SUCCESS")
    return UnknownResponse(data.message);

  const warnings = Object.entries(
    (data as RawCheckPasswordSuccessResponse).datas.rules,
  )
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (warnings.length > 0)
    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: `密码不满足要求: ${warnings.join(", ")}`,
    };

  return {
    success: true,
    data: {},
  };
};
