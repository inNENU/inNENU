import {
  MainInfoListOptions,
  MainInfoListResponse,
  MainInfoListSuccessResponse,
  MainInfoResponse,
  MainInfoSuccessResponse,
} from "./typings.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/net.js";
import { getRichTextNodes, getText } from "../utils/parser.js";

const MAIN_URL = "https://www.nenu.edu.cn";

const infoBodyRegExp =
  /<div class="article-info">([\s\S]*?)<div class="wrapper" id="footer">/;
const infoTitleRegExp = /<h1 class="arti-title">([\s\S]*?)<\/h1>/;
const infoTimeRegExp = /<span class="arti-update">时间：([^<]*)<\/span>/;
const infoFromRegExp = /<span class="arti-update">供稿单位：([^<]*)<\/span>/;
const infoAuthorRegExp = /<span class="arti-update">撰稿：([^<]*)<\/span>/;
const infoEditorRegExp = /<span>网络编辑：<em>([^<]+?)<\/em><\/span>/;
const infoContentRegExp =
  /<div class="v_news_content">([\s\S]+?)<\/div><\/div><div id="div_vote_id">/;
const pageViewParamRegExp = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export const getInfo = (url: string): Promise<MainInfoResponse> => {
  try {
    return request<string>(`${MAIN_URL}/${url}`).then((data) => {
      const body = infoBodyRegExp.exec(data)![1];
      const title = infoTitleRegExp.exec(body)![1];
      const time = infoTimeRegExp.exec(body)![1];
      const content = infoContentRegExp.exec(body)![1];
      const [, owner, clickID] = pageViewParamRegExp.exec(body)!;

      const from = infoFromRegExp.exec(body)?.[1];
      const author = infoAuthorRegExp.exec(body)?.[1];
      const editor = infoEditorRegExp.exec(body)?.[1];

      const pageViewUrl = `${MAIN_URL}/system/resource/code/news/click/dynclicks.jsp?clickid=${clickID}&owner=${owner}&clicktype=wbnews`;

      return request<string>(pageViewUrl).then((pageView) => {
        return getRichTextNodes(content, {
          getClass: (tag, className) =>
            tag === "img"
              ? className
                ? `img ${className}`
                : "img"
              : className ?? null,
          getImageSrc: (src) =>
            src.startsWith("/") ? `${MAIN_URL}${src}` : src,
        }).then(
          (content) =>
            <MainInfoSuccessResponse>{
              success: true,
              status: "success",
              title: getText(title),
              time,
              from,
              author,
              editor,
              pageView: Number(pageView),
              content,
            },
        );
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
