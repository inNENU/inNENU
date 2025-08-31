import type { RichTextNode } from "@mptool/all";
import { encodeBase64, getRichTextNodes, logger } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  ACTION_SERVER,
  ExpiredResponse,
  INFO_SERVER,
  UnknownResponse,
  createService,
  isWebVPNPage,
  supportRedirect,
  withActionLogin,
} from "../../../../service/index.js";

const ID_TITLE_REGEXP = /var title = '(.*?)';/;
const ID_FROM_REGEXP = /var ly = '(.*?)'/;
const ID_TIME_REGEXP =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+时间：(.*?)(?:&nbsp;)*?\s+<\/span>/;
const ID_PAGEVIEW_REGEXP =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+阅览：(\d+)\s+<\/span>/;
const ID_CONTENT_REGEXP =
  /<div class="read" id="WBNR">\s+([^]*?)\s+<\/div>\s+<p id="zrbj"/;

const TITLE_REGEXP = /name="pageTitle" content="(.*)"/;
const FROM_REGEXP = /<span>(?:发布单位|供稿单位)：(.*)<\/span>/;
const TIME_REGEXP = /<span>发布时间：(.*)<\/span>/;
const PAGEVIEW_REGEXP = /_showDynClicks\("wbnews", (\d+), (\d+)\)/;
const CONTENT_REGEXP =
  /<div id="vsb_content.*?>([^]*?)\s*<\/div>\s*<div id="div_vote_id"/;

export interface NoticeOptions {
  noticeID: string;
  noticeUrl?: string;
}

export interface NoticeData {
  title: string;
  from: string;
  time: string;
  pageView: number;
  content: RichTextNode[];
}

export type NoticeSuccessResponse = CommonSuccessResponse<NoticeData>;

export type NoticeResponse =
  | NoticeSuccessResponse
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

export const getNoticeDetailById = async (
  noticeID: string,
): Promise<NoticeResponse> => {
  try {
    const { data: text, status } = await request<string>(
      `${ACTION_SERVER}/page/viewNews?ID=${noticeID}`,
      { redirect: "manual" },
    );

    if (
      status === 302 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(text))
    ) {
      return ExpiredResponse;
    }

    const title = ID_TITLE_REGEXP.exec(text)![1];
    const time = ID_TIME_REGEXP.exec(text)![1];
    const from = ID_FROM_REGEXP.exec(text)![1];
    const pageView = ID_PAGEVIEW_REGEXP.exec(text)![1];
    const content = ID_CONTENT_REGEXP.exec(text)![1];

    const data = {
      title,
      from,
      time,
      pageView: Number(pageView),
      content: await getRichTextNodes(content, {
        transform: {
          a: (node) => {
            const href = node.attrs?.href;

            if (href && !href.startsWith(ACTION_SERVER))
              node.children?.push({ type: "text", text: ` (${href})` });

            return node;
          },
          // We won't support old notice image
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

export const getNoticeDetailByUrl = async (
  noticeUrl: string,
): Promise<NoticeResponse> => {
  try {
    const { data: text, status } = await request<string>(
      `${INFO_SERVER}${noticeUrl}`,
      { redirect: "manual" },
    );

    if (status === 302) return ExpiredResponse;

    const title = TITLE_REGEXP.exec(text)![1];
    const time = TIME_REGEXP.exec(text)![1];
    const from = FROM_REGEXP.exec(text)![1];
    const [, owner, clickId] = PAGEVIEW_REGEXP.exec(text)!;
    const content = CONTENT_REGEXP.exec(text)![1];

    const { data: pageview } = await request<string>(
      `${INFO_SERVER}/system/resource/code/news/click/dynclicks.jsp?clickid=${clickId}&owner=${owner}&clicktype=wbnews`,
      { redirect: "manual" },
    );

    const data = {
      title,
      from,
      time,
      pageView: Number(pageview),
      content: await getRichTextNodes(content, {
        transform: {
          a: (node) => {
            const href = node.attrs?.href;

            if (
              href &&
              !href.startsWith(ACTION_SERVER) &&
              !href.startsWith(INFO_SERVER)
            )
              node.children?.push({ type: "text", text: ` (${href})` });

            return node;
          },
          img: async (node) => {
            const src = node.attrs?.src;

            // convert to base64
            if (src?.startsWith("/")) {
              const {
                data: buffer,
                headers,
                status,
              } = await request<ArrayBuffer>(`${INFO_SERVER}${src}`, {
                responseType: "arraybuffer",
                redirect: "manual",
              });

              if (status === 200) {
                node.attrs!.src = `data:${headers.get(
                  "content-type",
                )};base64,${encodeBase64(buffer)}`;

                return node;
              }
            }

            return node;
          },
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

const getNoticeDetailLocal = ({
  noticeUrl,
  noticeID,
}: NoticeOptions): Promise<NoticeResponse> => {
  if (noticeUrl) return getNoticeDetailByUrl(noticeUrl);

  return getNoticeDetailById(noticeID);
};

const getNoticeDetailOnline = (
  options: NoticeOptions,
): Promise<NoticeResponse> =>
  request<NoticeResponse>("/action/notice-detail", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getNoticeDetail = withActionLogin(
  createService("notice-detail", getNoticeDetailLocal, getNoticeDetailOnline),
);
