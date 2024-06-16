import type { RichTextNode } from "@mptool/all";
import { getRichTextNodes } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  OFFICIAL_URL,
  createService,
  getOfficialPageView,
} from "../../../../service/index.js";

const INFO_REGEXP =
  /<div class="ar_tit">\s*<h3>([^>]+)<\/h3>\s*<h6>([^]+?)<\/h6>/;
const CONTENT_REGEXP =
  /<div class="v_news_content">([^]+?)<\/div><\/div><div id="div_vote_id">/;
const TIME_REGEXP = /<span>发布时间：([^<]*)<\/span>/;
const PAGEVIEW_PARAMS_REGEXP = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export interface OfficialAcademicData {
  /** 标题 */
  title: string;
  /** 时间 */
  time: string;
  /** 浏览量 */
  pageView: number;
  /** 内容 */
  content: RichTextNode[];
}

export type OfficialAcademicDetailSuccessResponse =
  CommonSuccessResponse<OfficialAcademicData>;

export type OfficialAcademicDetailResponse =
  | OfficialAcademicDetailSuccessResponse
  | CommonFailedResponse;

const getOfficialAcademicDetailLocal = async (
  url: string,
): Promise<OfficialAcademicDetailResponse> => {
  try {
    const { data: text, status } = await request<string>(
      `${OFFICIAL_URL}/${url}`,
    );

    if (status !== 200) throw new Error("请求失败");

    const [, title, info] = INFO_REGEXP.exec(text)!;

    const time = TIME_REGEXP.exec(info)![1];
    const [, owner, id] = PAGEVIEW_PARAMS_REGEXP.exec(info)!;
    const content = CONTENT_REGEXP.exec(text)![1];

    const data: OfficialAcademicData = {
      title,
      time,
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
    } as OfficialAcademicDetailSuccessResponse;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
};

const getOfficialAcademicDetailOnline = (
  url: string,
): Promise<OfficialAcademicDetailResponse> =>
  request<OfficialAcademicDetailResponse>(
    `/official/academic-detail?url=${url}`,
  ).then(({ data }) => data);

export const getOfficialAcademicDetail = createService(
  "official-academic-detail",
  getOfficialAcademicDetailLocal,
  getOfficialAcademicDetailOnline,
);
