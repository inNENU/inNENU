import { MAIN_URL, getPageView } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

const listBodyRegExp = /<ul class=".*? dsyw">([\s\S]+?)<\/ul>/;
const totalItemsRegExp = /<span class="p_t">共(\d+)条<\/span>/;
const pageViewRegExp =
  /_showDynClickBatch\(\[[^\]]+\],\s*\[([^\]]+)\],\s*"wbnews",\s*(\d+)\)/;
const researchItemRegExp =
  /data-aos="fade-up">\s*<a href="(?:\.\.\/)+([^"]+)"[^>]+>\s+<div[^>]*>\s+<div class="time">\s+<h3>(.*?)\.(.*?)<\/h3>\s*<h6>(.*?)<\/h6>\s*<\/div>\s*<\/div>\s*<div class="rr">\s*<h4[^>]*>(.*)<\/h4>\s+<p[^>]*>\s*([^<]*?)\s*<\/p>\s*<\/div>\s*(?:<div class="img slow imgBox">[\s\S]*?src="(.*?)"[\s\S]+?)?<\/a>/g;

export type InfoType = "social" | "science" | "news" | "media";

export interface InfoListOptions {
  type: InfoType;
  page?: number;
  totalPage?: number;
}

export interface InfoItem {
  /** 标题 */
  title: string;
  /** 时间 */
  time: string;
  /** 访问量 */
  pageView: number;
  /** 描述 */
  description: string;
  /** 封面 */
  cover?: string;
  /** 地址 */
  url: string;
}

export interface InfoListSuccessResponse {
  success: true;
  data: InfoItem[];
  page: number;
  totalPage: number;
}

export type InfoListResponse = InfoListSuccessResponse | CommonFailedResponse;

const type2ID = {
  social: "xsyj/rwsk",
  science: "xsyj/zrkx",
  news: "dsyw/ywsd",
  media: "dsyw/mtsd",
};

const totalPageState: Record<string, number> = {};

export const getInfoList = async ({
  type,
  page = 1,
  totalPage = totalPageState[type] || 0,
}: InfoListOptions): Promise<InfoListResponse> => {
  try {
    const { data: content } = await request<string>(
      totalPage && page !== 1
        ? `${MAIN_URL}/${type2ID[type]}/${totalPage - page + 1}.htm`
        : `${MAIN_URL}/${type2ID[type]}.htm`,
    );

    totalPageState[type] = Math.ceil(
      Number(totalItemsRegExp.exec(content)![1]) / 10,
    );

    const [, pageIds, owner] = pageViewRegExp.exec(content)!;

    const pageViews = await Promise.all(
      pageIds.split(/,\s*/).map((id) => getPageView(id, owner)),
    );

    const data = Array.from(
      listBodyRegExp.exec(content)![1].matchAll(researchItemRegExp),
    ).map(([, url, month, date, year, title, description, cover], index) => ({
      title,
      time: `${year}-${month}-${date}`,
      pageView: pageViews[index],
      description,
      url,
      ...(cover
        ? { cover: cover.startsWith("/") ? `${MAIN_URL}${cover}` : cover }
        : {}),
    }));

    return <InfoListSuccessResponse>{
      success: true,
      data,
      page,
      totalPage: totalPageState[type],
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return <CommonFailedResponse>{
      success: false,
      msg: message,
    };
  }
};

export const getOnlineInfoList = (
  options: InfoListOptions,
): Promise<InfoListResponse> =>
  request<InfoListResponse>("/main/info-list", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
