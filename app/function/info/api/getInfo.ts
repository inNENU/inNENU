import type { CommonFailedResponse } from "../../../../typings/index.js";
import type { RichTextNode } from "../../../../typings/node.js";
import { request } from "../../../api/index.js";
import { MAIN_URL, getPageView } from "../../../widgets/info/api/utils.js";
import { getRichTextNodes } from "../../utils/parser.js";

const infoRegExp =
  /<div class="ar_tit">\s*<h3>([^>]+)<\/h3>\s*<h6>([\s\S]+?)<\/h6>/;
const contentRegExp =
  /<div class="v_news_content">([\s\S]+?)<\/div><\/div><div id="div_vote_id">/;

const infoTimeRegExp = /<span>发布时间：([^<]*)<\/span>/;
const infoFromRegExp = /<span>供稿单位：([^<]*)<\/span>/;
const infoAuthorRegExp = /<span>撰稿：([^<]*)<\/span>/;
const infoEditorRegExp = /<span>网络编辑：<em>([^<]+?)<\/em><\/span>/;
const pageViewParamRegExp = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export interface MainInfoOptions {
  url: string;
}

export interface MainInfoSuccessResponse {
  success: true;
  title: string;
  time: string;
  from?: string;
  author?: string;
  editor?: string;
  pageView: number;
  content: RichTextNode[];
}

export type MainInfoResponse = MainInfoSuccessResponse | CommonFailedResponse;

export const getInfo = async (url: string): Promise<MainInfoResponse> => {
  try {
    const { data: text } = await request<string>(`${MAIN_URL}/${url}`);

    const [, title, info] = infoRegExp.exec(text)!;

    const time = infoTimeRegExp.exec(info)![1];
    const from = infoFromRegExp.exec(info)?.[1];
    const author = infoAuthorRegExp.exec(info)?.[1];
    const editor = infoEditorRegExp.exec(info)?.[1];
    const [, owner, id] = pageViewParamRegExp.exec(info)!;
    const content = contentRegExp.exec(text)![1];

    const pageView = await getPageView(id, owner);

    return <MainInfoSuccessResponse>{
      success: true,
      title,
      time,
      from,
      author,
      editor,
      pageView,
      content: await getRichTextNodes(content, {
        getClass: (tag, className) =>
          tag === "img"
            ? className
              ? `img ${className}`
              : "img"
            : className ?? null,
        getImageSrc: (src) =>
          src.includes("/fileTypeImages/")
            ? null
            : src.startsWith("/")
              ? `${MAIN_URL}${src}`
              : src,
      }),
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

export const getOnlineInfo = (url: string): Promise<MainInfoResponse> =>
  request<MainInfoResponse>(`/main/info?url=${url}`).then(({ data }) => data);
