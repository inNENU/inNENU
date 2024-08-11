import { request } from "../../../../api/index.js";
import { appName } from "../../../../config/info.js";
import type {
  ActionFailType,
  AuthLoginFailedResponse,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import { MissingCredentialResponse } from "../../../../service/index.js";
import { appID, envName, user } from "../../../../state/index.js";

export interface InfoData {
  uuid: string;
  type: "account" | "admission";
  id?: number;
  name: string;
  gender: string;
  school: string;
  major: string;
  grade: number;
  createTime: string;
  remark: string;
  verifyId?: number;
  verifyRemark?: string;
}

export interface StoreAccountInfoOptions {
  remark: string;
}

export type StoreAccountInfoCodeSuccessResponse = CommonSuccessResponse<{
  code: string;
}>;

export type StoreAccountInfoResponse =
  | StoreAccountInfoCodeSuccessResponse
  | CommonFailedResponse<
      | ActionFailType.WrongPassword
      | ActionFailType.BlackList
      | ActionFailType.EnabledSSO
      | ActionFailType.DatabaseError
      | ActionFailType.Error
      | ActionFailType.AccountLocked
      | ActionFailType.MissingCredential
      | ActionFailType.NeedCaptcha
      | ActionFailType.NeedReAuth
      | ActionFailType.Expired
      | ActionFailType.Forbidden
      | ActionFailType.Unknown
    >;

export const getIdCode = async (
  remark = "",
): Promise<StoreAccountInfoResponse> => {
  if (!user.account) return MissingCredentialResponse;

  return request<StoreAccountInfoResponse>("/mp/id-code", {
    method: "POST",
    body: {
      ...user.account,
      appID,
      remark,
    },
  }).then(({ data }) => data);
};

export interface VerifyCodeOptions {
  uuid: string;
  remark?: string;
}

export type VerifyCodeSuccessResponse = CommonSuccessResponse<InfoData>;

export type VerifyCodeResponse =
  | VerifyCodeSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse<
      | ActionFailType.DatabaseError
      | ActionFailType.MissingCredential
      | ActionFailType.WrongInfo
    >;

export const verifyCode = async ({
  uuid,
  remark = `由 ${appName} ${envName} 验证`,
}: VerifyCodeOptions): Promise<VerifyCodeResponse> => {
  if (!user.account) return MissingCredentialResponse;

  return request<VerifyCodeResponse>("/mp/id-code", {
    method: "POST",
    body: {
      ...user.account,
      uuid,
      remark,
    },
  }).then(({ data }) => data);
};
