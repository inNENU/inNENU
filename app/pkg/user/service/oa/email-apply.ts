import type { OALoginFailedResponse } from "./login.js";
import { withOALogin } from "./login.js";
import { OA_WEB_VPN_SERVER } from "./utils";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";

export interface CheckEmailOptions {
  type: "init";
  id: number;
}

export type CheckEmailSuccessResponse = CommonSuccessResponse<
  {
    display: string;
    key: string;
  }[]
>;

export type CheckEmailResponse =
  | CheckEmailSuccessResponse
  | OALoginFailedResponse
  | CommonFailedResponse<ActionFailType.Existed>;

export interface ApplyEmailOptions {
  type: "apply";
  /** 学号 */
  id: number;
  /** 邮箱账户名 */
  account: string;
  /** 数字后缀 */
  suffix?: string;
  /** 手机号码 */
  phone: string;
}

export type ApplyEmailResponse = CommonSuccessResponse | CommonFailedResponse;

export type EmailApplyOptions = CheckEmailOptions | ApplyEmailOptions;

export type EmailApplyResponse<T extends EmailApplyOptions> =
  T extends CheckEmailOptions ? CheckEmailResponse : ApplyEmailResponse;

const checkEmailOnline = async (
  options: CheckEmailOptions,
): Promise<CheckEmailResponse> =>
  request<CheckEmailResponse>("/oa/email-apply", {
    method: "POST",
    body: options,
    cookieScope: OA_WEB_VPN_SERVER,
  }).then(({ data }) => data);

export const checkEmail = withOALogin(checkEmailOnline);

const applyEmailOnline = async (
  options: ApplyEmailOptions,
): Promise<ApplyEmailResponse> =>
  request<ApplyEmailResponse>("/oa/email-apply", {
    method: "POST",
    body: options,
    cookieScope: OA_WEB_VPN_SERVER,
  }).then(({ data }) => data);

export const applyEmail = withOALogin(applyEmailOnline);
