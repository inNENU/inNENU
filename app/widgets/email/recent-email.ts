import { URLSearchParams, logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { ACTION_MAIN_PAGE, ACTION_SERVER } from "../../login/action.js";
import { LoginFailType, isWebVPNPage } from "../../login/index.js";
import type { AccountInfo } from "../../utils/typings.js";

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

export type ActionRecentMailResponse =
  | ActionRecentMailSuccessResponse
  | (CommonFailedResponse & {
      type?: LoginFailType.Expired | "not-initialized";
    });

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
  | (CommonFailedResponse & {
      type?: LoginFailType.Expired;
    });

const EMAIL_INFO_URL = `${ACTION_SERVER}/extract/getEmailInfo`;

export const recentEmails = async (): Promise<ActionRecentMailResponse> => {
  const { data: checkResult } = await request<RawRecentMailResponse | string>(
    EMAIL_INFO_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        Referer: ACTION_MAIN_PAGE,
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

export const onlineRecentEmails = async (): Promise<ActionRecentMailResponse> =>
  request<ActionRecentMailResponse>("/action/recent-email", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });

const EMAIL_PAGE_URL = `${ACTION_SERVER}/extract/sendRedirect2Email`;
const EMAIL_URL = `${ACTION_SERVER}/extract/sendRedirect2EmailPage`;

export const emailPage = async (mid = ""): Promise<ActionEmailPageResponse> => {
  const { data: emailPageResult } = await request<RawEmailPageResponse>(
    mid ? EMAIL_PAGE_URL : EMAIL_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        Referer: ACTION_MAIN_PAGE,
      },
      body: new URLSearchParams({
        ...(mid ? { domain: "nenu.edu.cn", mid } : {}),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_name: "",
      }),
    },
  );

  if (typeof emailPageResult === "object" && emailPageResult.success)
    return {
      success: true,
      url: emailPageResult.url,
    };

  return {
    success: false,
    msg: "获取邮件页面失败",
  };
};

export const onlineEmailPage = async (
  mid = "",
): Promise<ActionEmailPageResponse> =>
  request<ActionEmailPageResponse>("/action/email-page", {
    method: "POST",
    body: { mid },
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });
