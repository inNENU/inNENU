import { URLSearchParams, logger } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { LoginFailType } from "../loginFailTypes.js";
import { createService, isWebVPNPage } from "../utils.js";

const EMAIL_INFO_URL = `${ACTION_SERVER}/extract/getEmailInfo`;

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
  /** 发件人姓名 */
  name: string;
  /** 发件人邮件 */
  email: string;
  /** 邮件 ID */
  mid: string;
  /** 是否已读 */
  unread: boolean;
}

export interface ActionRecentMailSuccessResponse {
  success: true;
  /** 未读数 */
  unread: number;
  /** 近期邮件 */
  recent: EmailItem[];
}

export interface ActionRecentMailFailedResponse extends CommonFailedResponse {
  type?: LoginFailType.Expired | "not-initialized";
}

export type ActionRecentMailResponse =
  | ActionRecentMailSuccessResponse
  | ActionRecentMailFailedResponse;

const getRecentEmailsLocal = async (): Promise<ActionRecentMailResponse> => {
  const { data: checkResult } = await request<RawRecentMailResponse | string>(
    EMAIL_INFO_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        domain: "nenu.edu.cn",
        type: "1",
        format: "json",
      }),
      cookieScope: EMAIL_INFO_URL,
    },
  );

  if (typeof checkResult === "string" && isWebVPNPage(checkResult))
    return {
      success: false,
      type: LoginFailType.Expired,
      msg: "登录已过期，请重新登录",
    };

  if (
    typeof checkResult === "object" &&
    "success" in checkResult &&
    checkResult.success &&
    checkResult.emailList.con
  )
    return {
      success: true,
      unread: Number(checkResult.count),
      recent: checkResult.emailList.con.var.map(
        ({ subject, receivedDate, from, id, flags }) => ({
          subject,
          receivedDate,
          name: /"(.*)"/.exec(from)?.[1] ?? from,
          email: /<(.*)>/.exec(from)?.[1] ?? from,
          mid: id,
          unread: !flags.read,
        }),
      ),
    };

  return {
    success: false,
    type: "not-initialized",
    msg: "用户无邮箱或未初始化邮箱",
  };
};

const getRecentEmailsOnline = async (): Promise<ActionRecentMailResponse> =>
  request<ActionRecentMailResponse>("/action/recent-email", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });

export const getRecentEmails = createService(
  "recent-email",
  getRecentEmailsLocal,
  getRecentEmailsOnline,
);
