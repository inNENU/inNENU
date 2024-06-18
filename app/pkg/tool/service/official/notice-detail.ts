import type { RichTextNode } from "@mptool/all";
import { getRichTextNodes, logger } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  OFFICIAL_URL,
  UnknownResponse,
  createService,
  getOfficialPageView,
} from "../../../../service/index.js";

const INFO_REGEXP =
  /<div class="ar_tit">\s*<h3>([^>]+)<\/h3>\s*<h6>([^]+?)<\/h6>/;
const CONTENT_REGEXP =
  /<div class="v_news_content">([^]+?)<\/div><\/div><div id="div_vote_id">/;

const TIME_REGEXP = /<span>发布时间：([^<]*)<\/span>/;
const FROM_REGEXP = /<span>发布单位：([^<]*)<\/span>/;
const PAGEVIEW_PARAMS_REGEXP = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export interface OfficialNoticeData {
  /** 标题 */
  title: string;
  /** 时间 */
  time: string;
  /** 浏览量 */
  pageView: number;
  /** 发布单位 */
  from?: string;
  /** 内容 */
  content: RichTextNode[];
}

export type OfficialNoticeDetailSuccessResponse =
  CommonSuccessResponse<OfficialNoticeData>;

export type OfficialNoticeDetailResponse =
  | OfficialNoticeDetailSuccessResponse
  | CommonFailedResponse;

const getOfficialNoticeDetailLocal = async (
  url: string,
): Promise<OfficialNoticeDetailResponse> => {
  try {
    const { data: text, status } = await request<string>(
      `${OFFICIAL_URL}/${url}`,
    );

    if (status !== 200) throw new Error("请求失败");

    const [, title, info] = INFO_REGEXP.exec(text)!;

    const time = TIME_REGEXP.exec(info)![1];
    const from = FROM_REGEXP.exec(info)?.[1];

    const [, owner, id] = PAGEVIEW_PARAMS_REGEXP.exec(info)!;
    const content = CONTENT_REGEXP.exec(text)![1];

    const data: OfficialNoticeData = {
      title,
      time,
      from,
      pageView: await getOfficialPageView(id, owner),
      content: await getRichTextNodes(content, {
        transform: {
          img: (node) => {
            const src = node.attrs?.src;

            if (src) {
              if (src.includes("/fileTypeImages/")) return null;

              if (src.startsWith("/"))
                node.attrs!.src = `${OFFICIAL_URL}${src}`;
            }

            return node;
          },
          td: (node) => {
            delete node.attrs?.style;

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

const getOfficialNoticeDetailOnline = (
  url: string,
): Promise<OfficialNoticeDetailResponse> =>
  request<OfficialNoticeDetailResponse>(
    `/official/notice-detail?url=${url}`,
  ).then(({ data }) => data);

export const getOfficialNoticeDetail = createService(
  "official-notice-detail",
  getOfficialNoticeDetailLocal,
  getOfficialNoticeDetailOnline,
);
