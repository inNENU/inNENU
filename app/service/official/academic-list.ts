import { logger } from "@mptool/all";

import { OFFICIAL_URL, getOfficialPageView } from "./utils.js";
import { request } from "../../api/index.js";
import type {
  CommonFailedResponse,
  CommonListSuccessResponse,
} from "../utils/index.js";
import { createService } from "../utils/index.js";

const LIST_REGEXP = /<ul class=".*? xsyg">([^]+?)<\/ul>/;
const ITEM_REGEXP =
  /data-aos="fade-up">\s*<a href="(?:\.\.\/)+([^"]+)"[^>]+>\s+<div[^>]*>\s*<h4[^>]*>(.*)<\/h4>\s*<h6><span>报告人：<\/span>([^<]*?)<\/h6>\s*<h6><span>报告时间：<\/span>([^<]*?)<\/h6>\s*<h6><span>报告地点：<\/span>([^<]*?)<\/h6>/g;
const TOTAL_REGEXP = /<span class="p_t">共(\d+)条<\/span>/;
const PAGEVIEW_PARAMS_REGEXP =
  /_showDynClickBatch\(\[[^\]]+\],\s*\[([^\]]+)\],\s*"wbnews",\s*(\d+)\)/;

export interface OfficialAcademicListOptions {
  current?: number;
  total?: number;
}

export interface OfficialAcademicInfoItem {
  subject: string;
  person: string;
  time: string;
  location: string;
  pageView: number;
  url: string;
}

export type OfficialAcademicListSuccessResponse = CommonListSuccessResponse<
  OfficialAcademicInfoItem[]
>;

export type OfficialAcademicListResponse =
  | OfficialAcademicListSuccessResponse
  | CommonFailedResponse;

let totalPageState = 0;

const getOfficialAcademicListLocal = async ({
  current = 1,
  total = totalPageState || 0,
}: OfficialAcademicListOptions = {}): Promise<OfficialAcademicListResponse> => {
  try {
    const { data: content, status } = await request<string>(
      total && current !== 1
        ? `${OFFICIAL_URL}/xsyj/xsyg/${total - current + 1}.htm`
        : `${OFFICIAL_URL}/xsyj/xsyg.htm`,
    );

    if (status !== 200) throw new Error("请求失败");

    totalPageState = Math.ceil(Number(TOTAL_REGEXP.exec(content)![1]) / 10);

    const [, pageIds, owner] = PAGEVIEW_PARAMS_REGEXP.exec(content)!;

    const pageViews = await Promise.all(
      pageIds.split(/,\s*/).map((id) => getOfficialPageView(id, owner)),
    );

    const data = Array.from(
      LIST_REGEXP.exec(content)![1].matchAll(ITEM_REGEXP),
    ).map(([, url, subject, person, time, location], index) => ({
      subject,
      person,
      time,
      location,
      pageView: pageViews[index],
      url,
    }));

    return {
      success: true,
      data,
      current,
      total: totalPageState,
    };
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

const getOfficialAcademicListOnline = async (
  options: OfficialAcademicListOptions = {},
): Promise<OfficialAcademicListResponse> =>
  request<OfficialAcademicListResponse>(`/official/academic-list`, {
    method: "post",
    body: options,
  }).then(({ data }) => data);

export const getOfficialAcademicList = createService(
  "official-academic-list",
  getOfficialAcademicListLocal,
  getOfficialAcademicListOnline,
);
