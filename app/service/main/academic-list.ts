import { MAIN_URL, getPageView } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { createService } from "../utils.js";

const listBodyRegExp = /<ul class=".*? xsyg">([\s\S]+?)<\/ul>/;
const totalItemsRegExp = /<span class="p_t">共(\d+)条<\/span>/;
const pageViewRegExp =
  /_showDynClickBatch\(\[[^\]]+\],\s*\[([^\]]+)\],\s*"wbnews",\s*(\d+)\)/;
const academicItemRegExp =
  /data-aos="fade-up">\s*<a href="(?:\.\.\/)+([^"]+)"[^>]+>\s+<div[^>]*>\s*<h4[^>]*>(.*)<\/h4>\s*<h6><span>报告人：<\/span>([^<]*?)<\/h6>\s*<h6><span>报告时间：<\/span>([^<]*?)<\/h6>\s*<h6><span>报告地点：<\/span>([^<]*?)<\/h6>/g;

export interface AcademicListOptions {
  page?: number;
  totalPage?: number;
}

export interface AcademicInfoItem {
  subject: string;
  person: string;
  time: string;
  location: string;
  pageView: number;
  url: string;
}

export interface AcademicListSuccessResponse {
  success: true;
  data: AcademicInfoItem[];
  page: number;
  totalPage: number;
}

export type AcademicListResponse =
  | AcademicListSuccessResponse
  | CommonFailedResponse;

let totalPageState = 0;

const getAcademicListLocal = async ({
  page = 1,
  totalPage = totalPageState || 0,
}: AcademicListOptions = {}): Promise<AcademicListResponse> => {
  try {
    const { data: content } = await request<string>(
      totalPage && page !== 1
        ? `${MAIN_URL}/xsyj/xsyg/${totalPage - page + 1}.htm`
        : `${MAIN_URL}/xsyj/xsyg.htm`,
    );

    totalPageState = Math.ceil(Number(totalItemsRegExp.exec(content)![1]) / 10);

    const [, pageIds, owner] = pageViewRegExp.exec(content)!;

    const pageViews = await Promise.all(
      pageIds.split(/,\s*/).map((id) => getPageView(id, owner)),
    );

    const data = Array.from(
      listBodyRegExp.exec(content)![1].matchAll(academicItemRegExp),
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
      page,
      totalPage: totalPageState,
    } as AcademicListSuccessResponse;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
};

const getAcademicListOnline = async (
  options: AcademicListOptions = {},
): Promise<AcademicListResponse> =>
  request<AcademicListResponse>(`/main/academic-list`, {
    method: "post",
    body: options,
  }).then(({ data }) => data);

export const getAcademicList = createService(
  "academic-list",
  getAcademicListLocal,
  getAcademicListOnline,
);
