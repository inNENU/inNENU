import type { CommonFailedResponse } from "../../../../typings/index.js";
import { request } from "../../../api/index.js";
import { MAIN_URL, getPageView } from "../../../widgets/info/api/utils.js";
import type { RichTextNode } from "../../utils/parser.js";
import { getRichTextNodes } from "../../utils/parser.js";

const infoRegExp =
  /<div class="ar_tit">\s*<h3>([^>]+)<\/h3>\s*<h6>([\s\S]+?)<\/h6>/;
const contentRegExp =
  /<div class="v_news_content">([\s\S]+?)<\/div><\/div><div id="div_vote_id">/;

const infoTimeRegExp = /<span>发布时间：([^<]*)<\/span>/;
const infoFromRegExp = /<span>发布单位：([^<]*)<\/span>/;
const pageViewParamRegExp = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export interface AnnouncementInfoSuccessResponse {
  success: true;
  title: string;
  time: string;
  from?: string;
  pageView: number;
  content: RichTextNode[];
}

export type AnnouncementInfoResponse =
  | AnnouncementInfoSuccessResponse
  | CommonFailedResponse;

export const getAnnouncement = async (
  url: string,
): Promise<AnnouncementInfoResponse> => {
  try {
    const { data: text } = await request<string>(`${MAIN_URL}/${url}`);

    const [, title, info] = infoRegExp.exec(text)!;

    const time = infoTimeRegExp.exec(info)![1];
    const from = infoFromRegExp.exec(info)?.[1];

    const [, owner, id] = pageViewParamRegExp.exec(info)!;
    const content = contentRegExp.exec(text)![1];

    const pageView = await getPageView(id, owner);

    return <AnnouncementInfoSuccessResponse>{
      success: true,
      title,
      time,
      from,
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

export const getOnlineAnnouncement = (
  url: string,
): Promise<AnnouncementInfoResponse> =>
  request<AnnouncementInfoResponse>(`/main/announcement?url=${url}`).then(
    ({ data }) => data,
  );
