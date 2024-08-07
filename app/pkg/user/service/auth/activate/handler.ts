import type { ActivateInfoResponse } from "./get-info.js";
import { getActivateInfo } from "./get-info.js";
import type {
  ActivateSendSmsOptions,
  ActivateSendSmsResponse,
} from "./send-sms.js";
import { sendActivateSms } from "./send-sms.js";
import type {
  ActivateSetPasswordOptions,
  ActivateSetPasswordResponse,
} from "./set-password.js";
import { setPassword } from "./set-password.js";
import type {
  ActivateValidationOptions,
  ActivateValidationResponse,
} from "./validate-info.js";
import { validAccountInfo } from "./validate-info.js";
import type {
  ActivateValidSmsOptions,
  ActivateValidSmsResponse,
} from "./validate-sms.js";
import { validateActivateSms } from "./validate-sms.js";
import { request } from "../../../../../api/index.js";
import { createService } from "../../../../../service/index.js";
import type {
  CheckPasswordOptions,
  CheckPasswordResponse,
} from "../check-password.js";
import { checkPasswordLocal } from "../check-password.js";

export type ActivateOptions =
  | { type: "get-info" }
  | ActivateValidationOptions
  | ActivateSendSmsOptions
  | ActivateValidSmsOptions
  | CheckPasswordOptions
  | ActivateSetPasswordOptions;

export type ActivateResponse<T extends ActivateOptions = ActivateOptions> =
  T extends { type: "get-info" }
    ? ActivateInfoResponse
    : T extends { type: "validate-info" }
      ? ActivateValidationResponse
      : T extends { type: "send-sms" }
        ? ActivateSendSmsResponse
        : T extends { type: "validate-sms" }
          ? ActivateValidSmsResponse
          : T extends { type: "check-password" }
            ? CheckPasswordResponse
            : T extends { type: "set-password" }
              ? ActivateSetPasswordResponse
              : never;

const activateAccountLocal = async <T extends ActivateOptions>(
  options: T,
): Promise<ActivateResponse<T>> =>
  (options.type === "get-info"
    ? getActivateInfo()
    : options.type === "validate-info"
      ? validAccountInfo(options)
      : options.type === "send-sms"
        ? sendActivateSms(options)
        : options.type === "validate-sms"
          ? validateActivateSms(options)
          : options.type === "check-password"
            ? checkPasswordLocal(options, 3)
            : setPassword(options)) as Promise<ActivateResponse<T>>;

const activateAccountOnline = async <T extends ActivateOptions>(
  options: T,
): Promise<ActivateResponse<T>> =>
  request<ActivateResponse<T>>("/user/activate", {
    method: options.type === "get-info" ? "GET" : "POST",
    body: options.type === "get-info" ? undefined : JSON.stringify(options),
  }).then(({ data }) => data);

export const activateAccount = createService(
  "activate-account",
  activateAccountLocal,
  activateAccountOnline,
);
