import { ActionFailType } from "./actionFailType.js";

export interface CommonSuccessResponse<T = Record<never, never>> {
  success: true;
  data: T;
}

export interface CommonListSuccessResponse<T = Record<never, never>> {
  success: true;
  data: T;
  current: number;
  total: number;
}

export interface CommonFailedResponse<
  T extends ActionFailType = ActionFailType.Unknown,
> {
  success: false;
  type?: T;
  msg: string;
}

export type FailResponse<T> = T extends { success: false } ? T : never;

export interface CookieVerifyResponse {
  success: true;
  valid: boolean;
}

export const MissingCredentialResponse: CommonFailedResponse<ActionFailType.MissingCredential> =
  {
    success: false,
    type: ActionFailType.MissingCredential,
    msg: "缺少用户凭据",
  };

export const ExpiredResponse: CommonFailedResponse<ActionFailType.Expired> = {
  success: false,
  type: ActionFailType.Expired,
  msg: "登录信息已过期，请重新登录",
};

export const UnknownResponse = (
  msg: string,
): CommonFailedResponse<ActionFailType.Unknown> => ({
  success: false,
  type: ActionFailType.Unknown,
  msg,
});
