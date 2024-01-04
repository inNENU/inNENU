import { ACTION_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { RichTextNode } from "../../utils/parser.js";
import { getRichTextNodes } from "../../utils/parser.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { LoginFailType } from "../loginFailTypes.js";

const titleRegExp = /var title = '(.*?)';/;
const fromRegExp = /var ly = '(.*?)'/;
const authorRegExp = /var wz = '(.*?)'/;
const timeRegExp =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+时间：(.*?)(?:&nbsp;)*?\s+<\/span>/;
const pageViewRegExp =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+阅览：(\d+)\s+<\/span>/;
const contentRegExp =
  /<div class="read" id="WBNR">\s+([\s\S]*?)\s+<\/div>\s+<p id="zrbj"/;

export interface NoticeOptions {
  noticeID: string;
}

export interface NoticeSuccessResponse {
  success: true;
  title: string;
  author: string;
  time: string;
  from: string;
  pageView: number;
  content: RichTextNode[];
}

export type NoticeResponse = NoticeSuccessResponse | CommonFailedResponse;

export const getNotice = async ({
  noticeID,
}: NoticeOptions): Promise<NoticeResponse> => {
  try {
    const noticeUrl = `${ACTION_SERVER}/page/viewNews?ID=${noticeID}`;

    const { data: responseText, status } = await request<string>(noticeUrl, {
      redirect: "manual",
    });

    if (status === 302)
      return <AuthLoginFailedResponse>{
        success: false,
        type: LoginFailType.Expired,
        msg: "登录信息已过期，请重新登录",
      };

    const title = titleRegExp.exec(responseText)![1];
    const author = authorRegExp.exec(responseText)![1];
    const time = timeRegExp.exec(responseText)![1];
    const from = fromRegExp.exec(responseText)![1];
    const pageView = pageViewRegExp.exec(responseText)![1];
    const content = contentRegExp.exec(responseText)![1];

    return <NoticeSuccessResponse>{
      success: true,
      title,
      author,
      from,
      time,
      pageView: Number(pageView),
      content: await getRichTextNodes(content, {
        getLinkText: (link) =>
          link.startsWith(ACTION_SERVER) ||
          link.startsWith("https://my.webvpn.nenu.edu.cn")
            ? null
            : link,
        // TODO: Support image
        getImageSrc: () => null,
      }),
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return <AuthLoginFailedResponse>{
      success: false,
      msg: message,
    };
  }
};

export const getOnlineNotice = (
  options: NoticeOptions,
): Promise<NoticeResponse> =>
  request<NoticeResponse>("/action/notice", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) console.error("获取失败", data.msg);

    return data;
  });
