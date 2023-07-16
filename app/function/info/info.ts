import {
  type MainInfoResponse,
  type MainInfoSuccessResponse,
} from "./typings.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { request } from "../../api/index.js";
import { service } from "../../config/info.js";
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

export const getOnlineInfo = (url: string): Promise<MainInfoResponse> =>
  request<MainInfoResponse>(`${service}main/info?url=${url}`);
