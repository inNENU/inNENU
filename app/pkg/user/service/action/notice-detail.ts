import type { RichTextNode } from "@mptool/all";
import { getRichTextNodes, logger } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  ACTION_SERVER,
  ExpiredResponse,
  MY_SERVER,
  UnknownResponse,
  createService,
  isWebVPNPage,
  supportRedirect,
  withActionLogin,
} from "../../../../service/index.js";

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

export type NoticeResponse =
  | CommonSuccessResponse<NoticeData>
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const getNoticeLocalDetail = async (
  noticeID: string,
): Promise<NoticeResponse> => {
  try {
    if (!noticeID) throw new Error("ID is required");

    const noticeUrl = `${ACTION_SERVER}/page/viewNews?ID=${noticeID}`;

    const { data: text, status } = await request<string>(noticeUrl, {
      redirect: "manual",
    });

    if (
      status === 302 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(text))
    )
      return ExpiredResponse;

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
    };
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

const getNoticeOnlineDetail = (noticeID: string): Promise<NoticeResponse> =>
  request<NoticeResponse>("/action/notice-detail", {
    method: "POST",
    body: { noticeID },
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getNoticeDetail = withActionLogin(
  createService("notice-detail", getNoticeLocalDetail, getNoticeOnlineDetail),
);
