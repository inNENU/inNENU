import { request } from "../../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import { ActionFailType, authEncrypt } from "../../../../../service/index.js";
import { getPasswordRule } from "../get-password-rule.js";
import type { ResetCaptchaInfo } from "../reset-captcha.js";
import { getResetCaptchaLocal } from "../reset-captcha.js";
import { RESET_PREFIX, RESET_SALT } from "../utils.js";

interface RawResetPasswordValidateCodeInfo {
  limitTime: number;
  sign: string;
}

interface RawResetPasswordValidateCodeSuccessData {
  code: "0";
  message: null;
  datas: string;
}

interface RawResetPasswordValidateCodeFailedData {
  code: "2106990000";
  message: string;
  datas: null;
}

type RawResetPasswordValidateCodeData =
  | RawResetPasswordValidateCodeSuccessData
  | RawResetPasswordValidateCodeFailedData;

export interface ResetPasswordValidateCodeOptions {
  type: "validate-code";
  /** 学号 */
  id: string;
  /** 验证码图片 base64 字符串 */
  captcha: string;
  /** 验证码 ID */
  captchaId: string;
  /** 代码 */
  code: string;

  cellphone: string;
  email: string;
  hideCellphone: string;
  hideEmail: string;
  isAppealFlag: "0" | "1";
  appealSign: string;
  sign: string;
}

export type ResetPasswordValidateCodeSuccessResponse = CommonSuccessResponse<{
  limitTime: number;
  sign: string;
  rules: string[];
}>;

export type ResetPasswordValidateCodeResponse =
  | ResetPasswordValidateCodeSuccessResponse
  | (CommonFailedResponse<ActionFailType.WrongCaptcha> & {
      data: ResetCaptchaInfo;
    })
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

export const verifyCode = async ({
  id,
  captcha,
  captchaId,
  code,
  cellphone,
  email,
  hideCellphone,
  hideEmail,
  isAppealFlag,
  appealSign,
  sign,
}: ResetPasswordValidateCodeOptions): Promise<ResetPasswordValidateCodeResponse> => {
  const { data } = await request<RawResetPasswordValidateCodeData>(
    `${RESET_PREFIX}/passwordRetrieve/checkCode`,
    {
      method: "POST",
      body: {
        accountId: "",
        type: "cellphone",
        loginNo: id,
        captcha,
        captchaId,
        hideCellphone,
        hideEmail,
        cellphone: cellphone ? authEncrypt(cellphone, RESET_SALT) : "",
        email: email ? authEncrypt(email, RESET_SALT) : "",
        code,
        password: "",
        confirmPassword: "",
        isAppealFlag,
        appealSign,
        sign,
        limitTime: 120,
      },
    },
  );

  if (data.code !== "0") {
    if (data.message === "验证码错误") {
      const captchaResponse = await getResetCaptchaLocal();

      if (!captchaResponse.success) return captchaResponse;

      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: data.message,
        data: captchaResponse.data,
      };
    }

    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: data.message,
    };
  }

  const result = await getPasswordRule();

  return {
    success: true,
    data: {
      ...(JSON.parse(data.datas) as RawResetPasswordValidateCodeInfo),
      rules: result.data,
    },
  };
};
