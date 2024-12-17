import { request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import { ActionFailType, authEncrypt } from "../../../../../service/index.js";
import { RESET_PREFIX, RESET_SALT } from "../utils.js";

interface RawResetPasswordSetSuccessData {
  code: "0";
  message: string;
  datas: null;
}

interface RawResetPasswordSetFailedData {
  code: "2106990000";
  message: string;
  datas: null;
}

type RawResetPasswordSetData =
  | RawResetPasswordSetSuccessData
  | RawResetPasswordSetFailedData;

export interface ResetPasswordSetOptions {
  type: "reset-password";
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
  password: string;
  isAppealFlag: "0" | "1";
  appealSign: string;
  sign: string;
}

export type ResetPasswordSetResponse = { success: true } | CommonFailedResponse;

export const setPassword = async ({
  id,
  captcha,
  captchaId,
  code,
  cellphone,
  email,
  hideCellphone,
  hideEmail,
  password,
  isAppealFlag,
  appealSign,
  sign,
}: ResetPasswordSetOptions): Promise<ResetPasswordSetResponse> => {
  const { data } = await request<RawResetPasswordSetData>(
    `${RESET_PREFIX}/passwordRetrieve/resetPassword`,
    {
      method: "POST",
      body: {
        type: "cellphone",
        loginNo: id,
        captcha,
        captchaId,
        hideCellphone,
        hideEmail,
        cellphone: cellphone ? authEncrypt(cellphone, RESET_SALT) : "",
        email: email ? authEncrypt(email, RESET_SALT) : "",
        code,
        password: authEncrypt(password, RESET_SALT),
        confirmPassword: authEncrypt(password, RESET_SALT),
        isAppealFlag,
        appealSign,
        sign,
      },
    },
  );

  if (data.code !== "0") {
    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: data.message,
    };
  }

  return {
    success: true,
  };
};
