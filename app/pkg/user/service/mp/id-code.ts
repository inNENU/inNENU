import { request } from "../../../../api/index.js";
import { appName } from "../../../../config/info.js";
import type {
  ActionFailType,
  AuthLoginFailedResponse,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import { MissingCredentialResponse } from "../../../../service/index.js";
import { appId, envName, user } from "../../../../state/index.js";

export interface GenerateIdCodeOptions {
  remark: string;
  force?: boolean;
}

export type GenerateIdCodeCodeSuccessResponse = CommonSuccessResponse<{
  code: string;
  existed: boolean;
}>;

export type GenerateIdCodeResponse =
  | GenerateIdCodeCodeSuccessResponse
  | CommonFailedResponse<
      | ActionFailType.Expired
      | ActionFailType.Existed
      | ActionFailType.DatabaseError
      | ActionFailType.MissingArg
      | ActionFailType.MissingCredential
      | ActionFailType.Unknown
    >;

export const generateIdCode = async (
  remark = "",
  force = false,
): Promise<GenerateIdCodeResponse> => {
  if (!user.account) return MissingCredentialResponse;

  return request<GenerateIdCodeResponse>("/mp/generate-id-code", {
    method: "POST",
    body: {
      id: user.account.id,
      authToken: user.account.authToken,
      appId,
      remark,
      force,
    },
  }).then(({ data }) => data);
};

export interface CheckIDCodeOptions {
  uuid?: string;
  remark?: string;
}

export interface IdCodeInfo {
  name: string;
  grade: number;
  type: string;
  org: string;
  major: string;
  createTime: string;

  /**
   * @description Only available for admin
   */
  id: number | null;
  /**
   * @description Only available for admin
   */
  gender: string | null;
}

export type CheckIDCodeStatusSuccessResponse = CommonSuccessResponse<
  | { existed: true; code: string; remark: string }
  | { existed: false; verifier: string | null }
>;
export type CheckIDCodeInfoSuccessResponse = CommonSuccessResponse<IdCodeInfo>;

export type CheckIDCodeResponse<T extends string | void> =
  | (T extends string
      ? CheckIDCodeInfoSuccessResponse
      : CheckIDCodeStatusSuccessResponse)
  | AuthLoginFailedResponse
  | CommonFailedResponse<
      | ActionFailType.DatabaseError
      | ActionFailType.WrongInfo
      | ActionFailType.MissingArg
      | ActionFailType.MissingCredential
    >;

export const checkIdCode = async <T extends string | void>(
  uuid?: T,
): Promise<CheckIDCodeResponse<T>> => {
  if (!user.account) return MissingCredentialResponse;

  return request<CheckIDCodeResponse<T>>("/mp/check-id-code", {
    method: "POST",
    body: {
      id: user.account.id,
      authToken: user.account.authToken,
      appId,
      openid: user.openid,
      uuid,
      remark: `由 ${user.info?.name ?? "未知用户"} 通过 ${appName} ${envName} 验证`,
    },
  }).then(({ data }) => data);
};
