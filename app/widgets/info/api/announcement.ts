import { MAIN_URL, getPageView } from "./utils.js";
import type { CommonFailedResponse } from "../../../../typings/index.js";
import { request } from "../../../api/index.js";

const totalItemsRegExp = /<span class="p_t">共(\d+)条<\/span>/;
const pageViewRegExp =
  /_showDynClickBatch\(\[[^\]]+\],\s*\[([^\]]+)\],\s*"wbnews",\s*(\d+)\)/;
const noticeItemRegExp =
  /data-aos="fade-up">\s*<a href="([^"]+)"[^>]+>\s+<div class="time">\s+<h3>(.*?)\.(.*?)<\/h3>\s*<h6>(.*?)<\/h6>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>(.*)<\/h4>\s+<h6>(.*?)<span>/g;

export interface AnnouncementListOptions {
  page?: number;
  totalPage?: number;
}

export interface AnnouncementInfoItem {
  /** 标题 */
  title: string;
  /** 时间 */
  time: string;
  /** 访问量 */
  pageView: number;
  /** 来源 */
  from: string;
  /** 地址 */
  url: string;
}

export interface AnnouncementListSuccessResponse {
  success: true;
  data: AnnouncementInfoItem[];
  page: number;
  totalPage: number;
}

export type AnnouncementListResponse =
  | AnnouncementListSuccessResponse
  | CommonFailedResponse;

let totalPageState = 0;

export const getAnnouncementList = async ({
  page = 1,
  totalPage = totalPageState,
}: AnnouncementListOptions = {}): Promise<AnnouncementListResponse> => {
  try {
    const { data: content } = await request<string>(
      totalPage && page !== 1
        ? `${MAIN_URL}/tzgg/${totalPage - page + 1}.htm`
        : `${MAIN_URL}/tzgg.htm`,
    );

    totalPageState = Math.ceil(Number(totalItemsRegExp.exec(content)![1]) / 10);

    const [, pageIds, owner] = pageViewRegExp.exec(content)!;

    const pageViews = await Promise.all(
      pageIds.split(/,\s*/).map((id) => getPageView(id, owner)),
    );

    const data = Array.from(content.matchAll(noticeItemRegExp)).map(
      ([, url, month, date, year, title, from], index) => ({
        title,
        time: `${year}-${month}-${date}`,
        pageView: pageViews[index],
        from,
        url,
      }),
    );

    return <AnnouncementListSuccessResponse>{
      success: true,
      data,
      page,
      totalPage: totalPageState,
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

export const getOnlineAnnouncementList = async (
  options: AnnouncementListOptions = {},
): Promise<AnnouncementListResponse> =>
  request<AnnouncementListResponse>(`/main/announcement-list`, {
    method: "post",
    body: options,
  }).then(({ data }) => data);
