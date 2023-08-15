import type { CommonFailedResponse } from "../../../typings/response.js";
import type {
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "../../login/typings.js";
import type { AccountInfo } from "../../utils/typings.js";

export type RawCheckMailData = { flag: false; yxmc: string } | { flag: true };

export interface RawAccountList {
  success: boolean;
  data: { text: string; value: string }[];
}

export interface GetEmailNameResponse {
  success: true;
  hasEmail: true;
  email: string;
}

export interface GetEmailInfoResponse {
  success: true;
  hasEmail: false;
  accounts: string[];
  taskId: string;
  instanceId: string;
}

export type GetEmailResponse =
  | GetEmailNameResponse
  | GetEmailInfoResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export interface ActivateEmailOptions {
  type: "set";
  name: string;
  emailPassword?: string;
  phone: number | string;
  suffix?: number | string;
  taskId: string;
  instanceId: string;
}

export interface ActivateEmailSuccessResponse {
  success: true;
  email: string;
  password: string;
}

export type ActivateMailFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export type ActivateEmailResponse =
  | ActivateEmailSuccessResponse
  | ActivateMailFailedResponse;

interface RawEmailItem {
  /** 发件人 */
  from: string;
  /** 邮件ID */
  id: string;
  /** 接收日期 */
  receivedDate: number;
  /** 发送日期 */
  sentDate: number;
  /** 偶见大小 */
  size: number;

  /** 邮件主题 */
  subject: string;
  to: string;

  fid: 1;
  flags: {
    read: boolean;
    popRead: boolean;
    attached: boolean;
  };
}

interface RawRecentMailSuccessResponse {
  success: true;
  count: string;
  emailList: {
    suc: true;
    ver: 0;
    /** 账户名称 */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    account_name: string;
    con: {
      /** 总数 */
      total: number;
      var: RawEmailItem[];
    };
  };
}

interface RawRecentMailFailedResponse {
  emailList: {
    suc: false;
    ver: 0;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    error_code: string;
  };
}

type RawRecentMailResponse =
  | RawRecentMailSuccessResponse
  | RawRecentMailFailedResponse;

export interface EmailItem {
  /** 邮件主题 */
  subject: string;
  /** 接收日期 */
  receivedDate: number;
  /** 发件人 */
  from: string;
  /** 邮件 ID */
  mid: string;
}

export interface ActionRecentMailResponse {
  success: true;
  /** 未读数 */
  unread: number;
  /** 近期邮件 */
  recent: EmailItem[];
}

export interface ActionEmailPageOptions extends Partial<AccountInfo> {
  /** 邮件 ID */
  mid?: string;
}

export interface RawEmailPageResponse {
  success: boolean;
  url: string;
}

export interface ActionEmailPageSuccessResponse {
  success: true;
  url: string;
}

export type ActionEmailPageResponse =
  | ActionEmailPageSuccessResponse
  | CommonFailedResponse;
