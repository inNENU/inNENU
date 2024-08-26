import { URLSearchParams, logger } from "@mptool/all";

import { withActionLogin } from "./login.js";
import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";
import {
  ActionFailType,
  ExpiredResponse,
  UnknownResponse,
  createService,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";

const EMAIL_INFO_URL = `${ACTION_SERVER}/extract/getEmailInfo`;

interface RawEmailData {
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
      var: RawEmailData[];
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

export interface EmailData {
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

const getRecentEmailData = ({
  subject,
  receivedDate,
  from,
  id,
  flags,
}: RawEmailData): EmailData => ({
  subject,
  receivedDate,
  name: /"(.*)"/.exec(from)?.[1] ?? from,
  email: /<(.*)>/.exec(from)?.[1] ?? from,
  mid: id,
  unread: !flags.read,
});

export interface ActionRecentMailData {
  /** 未读数 */
  unread: number;
  /** 近期邮件 */
  emails: EmailData[];
}

export type ActionRecentMailResponse =
  | CommonSuccessResponse<ActionRecentMailData>
  | CommonFailedResponse<
      | ActionFailType.Expired
      | ActionFailType.NotInitialized
      | ActionFailType.Unknown
    >;

const getRecentEmailsLocal = async (): Promise<ActionRecentMailResponse> => {
  try {
    const { data, status } = await request<RawRecentMailResponse>(
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
        redirect: "manual",
      },
    );

    if (
      status === 302 ||
      // Note: On QQ the status code is 404
      status === 404 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(data))
    ) {
      return ExpiredResponse;
    }

    if ("success" in data && data.success && data.emailList.con) {
      return {
        success: true,
        data: {
          unread: Number(data.count),
          emails: data.emailList.con.var.map(getRecentEmailData),
        },
      };
    }

    return {
      success: false,
      type: ActionFailType.NotInitialized,
      msg: "用户无邮箱或未初始化邮箱",
    };
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

const getRecentEmailsOnline = async (): Promise<ActionRecentMailResponse> =>
  request<ActionRecentMailResponse>("/action/recent-email", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取近期邮件失败", data);

    return data;
  });

export const getRecentEmails = withActionLogin(
  createService("recent-email", getRecentEmailsLocal, getRecentEmailsOnline),
);
