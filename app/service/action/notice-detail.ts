import type { RichTextNode } from "@mptool/all";
import { getRichTextNodes } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { MY_SERVER } from "../my/utils.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";
import { LoginFailType, createService } from "../utils/index.js";

const TITLE_REGEXP = /var title = '(.*?)';/;
const FROM_REGEXP = /var ly = '(.*?)'/;
const AUTHOR_REGEXP = /var wz = '(.*?)'/;
const TIME_REGEXP =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+时间：(.*?)(?:&nbsp;)*?\s+<\/span>/;
const PAGEVIEW_REGEXP =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+阅览：(\d+)\s+<\/span>/;
const CONTENT_REGEXP =
  /<div class="read" id="WBNR">\s+([^]*?)\s+<\/div>\s+<p id="zrbj"/;

export interface NoticeData {
  title: string;
  author: string;
  time: string;
  from: string;
  pageView: number;
  content: RichTextNode[];
}

export type NoticeSuccessResponse = CommonSuccessResponse<NoticeData>;

export type NoticeResponse = NoticeSuccessResponse | CommonFailedResponse;

const getNoticeLocal = async (noticeID: string): Promise<NoticeResponse> => {
  try {
    if (!noticeID) throw new Error("ID is required");

    const noticeUrl = `${ACTION_SERVER}/page/viewNews?ID=${noticeID}`;

    const { data: text, status } = await request<string>(noticeUrl, {
      redirect: "manual",
    });

    if (status === 302)
      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录信息已过期，请重新登录",
      } as AuthLoginFailedResponse;

    const title = TITLE_REGEXP.exec(text)![1];
    const author = AUTHOR_REGEXP.exec(text)![1];
    const time = TIME_REGEXP.exec(text)![1];
    const from = FROM_REGEXP.exec(text)![1];
    const pageView = PAGEVIEW_REGEXP.exec(text)![1];
    const content = CONTENT_REGEXP.exec(text)![1];

    const data = {
      title,
      author,
      from,
      time,
      pageView: Number(pageView),
      content: await getRichTextNodes(content, {
        transform: {
          a: (node) => {
            const href = node.attrs?.href;

            if (
              href &&
              !href.startsWith(ACTION_SERVER) &&
              !href.startsWith(MY_SERVER)
            )
              node.children?.push({ type: "text", text: ` (${href})` });

            return node;
          },
          // TODO: Support image
          img: () => null,
        },
      }),
    };

    return {
      success: true,
      data,
    } as NoticeSuccessResponse;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as AuthLoginFailedResponse;
  }
};

const getNoticeOnline = (noticeID: string): Promise<NoticeResponse> =>
  request<NoticeResponse>("/action/notice-detail", {
    method: "POST",
    body: { noticeID },
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) console.error("获取失败", data.msg);

    return data;
  });

export const getNotice = createService(
  "notice",
  getNoticeLocal,
  getNoticeOnline,
);
