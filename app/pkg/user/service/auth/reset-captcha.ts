import { encodeBase64 } from "@mptool/all";

import { RESET_PREFIX } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  RestrictedResponse,
  UnknownResponse,
} from "../../../../service/index.js";
import { generateRandomString } from "../../utils/index.js";

const CAPTCHA_URL = `${RESET_PREFIX}/generateCaptcha`;

export interface ResetCaptchaInfo {
  /** 验证码图片 base64 字符串 */
  captcha: string;
  /** 验证码 ID */
  captchaId: string;
}

export type ResetCaptchaSuccessResponse =
  CommonSuccessResponse<ResetCaptchaInfo>;

export type ResetCaptchaResponse =
  | ResetCaptchaSuccessResponse
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

export const getResetCaptchaLocal = async (): Promise<ResetCaptchaResponse> => {
  const captchaId = generateRandomString(16);
  const { data, headers } = await request<ArrayBuffer>(
    `${CAPTCHA_URL}?ltId=${captchaId}&codeType=2`,
    { responseType: "arraybuffer" },
  );

  if (headers.get("Content-Type") === "text/html") return RestrictedResponse;

  if (!headers.get("Content-Type")?.startsWith("image/jpeg")) {
    return UnknownResponse("获取验证码失败");
  }

  return {
    success: true,
    data: {
      captcha: `data:image/jpeg;base64,${encodeBase64(data)}`,
      captchaId,
    },
  };
};
