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
  MY_SERVER,
  UnknownResponse,
  createService,
  isWebVPNPage,
  supportRedirect,
  withActionLogin,
} from "../../../../service/index.js";

const TITLE_REGEXP = /name="pageTitle" content="(.*)"/;
const FROM_REGEXP = /<span>(?:发布单位|供稿单位)：(.*)<\/span>/;
const TIME_REGEXP = /<span>发布时间：(.*)<\/span>/;
const PAGEVIEW_REGEXP = /_showDynClicks\("wbnews", (\d+), (\d+)\)/;
const CONTENT_REGEXP =
  /<div id="vsb_content.*?>([^]*?)\s*<\/div>\s*<div id="div_vote_id"/;

export interface NoticeData {
  title: string;
  from: string;
  time: string;
  pageView: number;
  content: RichTextNode[];
}

export type NoticeResponse =
  | CommonSuccessResponse<NoticeData>
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const getNoticeLocalDetail = async (
  noticeUrl: string,
): Promise<NoticeResponse> => {
  try {
    const { data: text, status } = await request<string>(
      `${INFO_SERVER}${noticeUrl}`,
      { redirect: "manual" },
    );

    if (
      status === 302 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(text))
    )
      return ExpiredResponse;

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
              !href.startsWith(INFO_SERVER) &&
              !href.startsWith(MY_SERVER)
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
