import {
  type MainInfoListOptions,
  type MainInfoListResponse,
  type MainInfoListSuccessResponse,
} from "./typings.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/index.js";
import { service } from "../../config/info.js";

const MAIN_URL = "https://www.nenu.edu.cn";

const type2ID = {
  notice: "tzgg",
  news: "dsxw1",
  academic: "xshd1",
};

const listBodyRegExp = /<tbody>([\s\S]*?)<\/tbody>/;
const totalPageRegExp = /_simple_list_gotopage_fun\((\d+),/;
const pageViewRegExp =
  /\[(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\],"wbnews", (\d+)\)/;
const noticeItemRegExp =
  /<a href="(?:\.\.\/)+([^"]+)"[^>]+>([^<]+)<\/a>\s*<\/h2>\s*<\/td>\s*<td class="news-table-department">\s*<span id="sou1">([^<]*)<\/span>\s*<\/td>\s*<td class="news-table-date">\s+<span>([^<]*)<\/span>/g;
const newsItemRegExp =
  /<a href="(?:\.\.\/)+([^"]+)"[^>]+>([^<]+)<\/a>\s*<\/h2>\s*<\/td>\s*<td class="news-table-department">\s*<span id="sou1">([^<]*)<\/span>\s*<\/td>\s*<td class="news-table-date">\s+<span>([^<]*)<\/span>/g;

const totalPageState: Record<string, number> = {};

export const getInfoList = (
  options: MainInfoListOptions,
): Promise<MainInfoListResponse> => {
  const { type, page = 1, totalPage = totalPageState[type] || 0 } = options;

  const url =
    totalPage && page !== 1
      ? `${MAIN_URL}/index/${type2ID[type]}/${totalPage - page}.htm`
      : `${MAIN_URL}/index/${type2ID[type]}.htm`;

  try {
    return request<string>(url).then((content) => {
      totalPageState[type] = Number(totalPageRegExp.exec(content)![1]);

      const matched = pageViewRegExp.exec(content)!.slice(1).map(Number);

      const owner = matched.pop();

      const pageViewUrl = `${MAIN_URL}/system/resource/code/news/click/dynclicksbatch.jsp?clickids=${matched.join(
        ",",
      )}&owner=${owner}&clicktype=wbnews`;

      return request<string>(pageViewUrl).then((pageViewContent) => {
        const pageViews = pageViewContent.split(",").map(Number);

        const data = Array.from(
          listBodyRegExp
            .exec(content)![1]
            .matchAll(type === "notice" ? noticeItemRegExp : newsItemRegExp),
        ).map(([, url, title, from, time], index) => ({
          url,
          title,
          from,
          time,
          pageView: pageViews[index],
        }));

        return <MainInfoListSuccessResponse>{
          success: true,
          data,
          page,
          totalPage: totalPageState[type],
        };
      });
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return Promise.resolve(<CommonFailedResponse>{
      success: false,
      msg: message,
    });
  }
};

export const getOnlineInfoList = (
  options: MainInfoListOptions,
): Promise<MainInfoListResponse> =>
  request<MainInfoListResponse>(`${service}main/info-list`, {
    method: "POST",
    data: options,
  });
