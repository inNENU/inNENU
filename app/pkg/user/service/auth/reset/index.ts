import type {
  ResetPasswordGetInfoOptions,
  ResetPasswordGetInfoResponse,
} from "./get-info.js";
import { getInfo } from "./get-info.js";
import type {
  ResetPasswordSetOptions,
  ResetPasswordSetResponse,
} from "./reset-password.js";
import { setPassword } from "./reset-password.js";
import type {
  ResetPasswordSendCodeOptions,
  ResetPasswordSendCodeResponse,
} from "./send-code.js";
import { sendCode } from "./send-code.js";
import type {
  ResetPasswordValidateCodeOptions,
  ResetPasswordValidateCodeResponse,
} from "./verify-code.js";
import { verifyCode } from "./verify-code.js";
import { request } from "../../../../../api/index.js";
import {
  UnknownResponse,
  createService,
} from "../../../../../service/index.js";
import type {
  CheckPasswordOptions,
  CheckPasswordResponse,
} from "../check-password.js";
import { checkPasswordLocal } from "../check-password.js";
import type { ResetCaptchaResponse } from "../reset-captcha.js";
import { getResetCaptchaLocal } from "../reset-captcha.js";
import { RESET_PREFIX } from "../utils.js";

export type ResetPasswordOptions =
  | { type: "init" }
  | ResetPasswordGetInfoOptions
  | ResetPasswordSendCodeOptions
  | ResetPasswordValidateCodeOptions
  | CheckPasswordOptions
  | ResetPasswordSetOptions;

export type ResetPasswordResponse<T extends ResetPasswordOptions> = T extends {
  type: "init";
}
  ? ResetCaptchaResponse
  : T extends ResetPasswordGetInfoOptions
    ? ResetPasswordGetInfoResponse
    : T extends ResetPasswordSendCodeOptions
      ? ResetPasswordSendCodeResponse
      : T extends ResetPasswordValidateCodeOptions
        ? ResetPasswordValidateCodeResponse
        : T extends CheckPasswordOptions
          ? CheckPasswordResponse
          : T extends ResetPasswordSetOptions
            ? ResetPasswordSetResponse
            : never;

const resetPasswordLocal = async <T extends ResetPasswordOptions>(
  options: T,
): Promise<ResetPasswordResponse<T>> => {
  try {
    return (
      options.type === "init"
        ? await getResetCaptchaLocal()
        : options.type === "get-info"
          ? await getInfo(options)
          : options.type === "send-code"
            ? await sendCode(options)
            : options.type === "validate-code"
              ? await verifyCode(options)
              : options.type === "check-password"
                ? await checkPasswordLocal(options, 1)
                : await setPassword(options)
    ) as ResetPasswordResponse<T>;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return UnknownResponse(message) as ResetPasswordResponse<T>;
  }
};

const resetPasswordOnline = async <T extends ResetPasswordOptions>(
  options: T,
): Promise<ResetPasswordResponse<T>> =>
  request<ResetPasswordResponse<T>>("/auth/reset-password", {
    method: options.type === "init" ? "GET" : "POST",
    ...(options.type === "init" ? {} : { body: options }),
    cookieScope: RESET_PREFIX,
  }).then(({ data }) => data);

export const resetPassword = createService(
  "reset-password",
  resetPasswordOnline,
  resetPasswordLocal,
);
