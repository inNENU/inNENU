import { request } from "../../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import { UnknownResponse, authEncrypt } from "../../../../../service/index.js";
import { RESET_PREFIX, RESET_SALT } from "../utils.js";

export interface ActivateSetPasswordOptions {
  type: "set-password";
  sign: string;
  password: string;
}

interface RawSetPasswordSuccessResponse {
  code: 0;
  success: true;
}

interface RawSetPasswordFailResponse {
  code: unknown;
  success: false;
  message: string;
}

type RawSetPasswordResponse =
  | RawSetPasswordSuccessResponse
  | RawSetPasswordFailResponse;

export type ActivateSetPasswordResponse =
  | CommonSuccessResponse
  | CommonFailedResponse;

export const setPassword = async ({
  sign,
  password,
}: ActivateSetPasswordOptions): Promise<ActivateSetPasswordResponse> => {
  const { data } = await request<RawSetPasswordResponse>(
    `${RESET_PREFIX}/accountActivation/initPassword`,
    {
      method: "POST",
      body: {
        sign,
        password: authEncrypt(password, RESET_SALT),
        confirmPassword: authEncrypt(password, RESET_SALT),
      },
    },
  );

  if (data.code !== "0" || !data.success)
    return UnknownResponse((data as RawSetPasswordFailResponse).message);

  return {
    success: true,
    data: {},
  };
};
