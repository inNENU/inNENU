import {
  type NoticeOptions,
  type NoticeResponse,
  type NoticeSuccessResponse,
} from "./typings.js";
import {
  ACTION_SERVER,
  AuthLoginFailedResponse,
  request,
} from "../../api/index.js";
import { service } from "../../config/index.js";
import { getRichTextNodes } from "../utils/parser.js";

const titleRegExp = /var title = '(.*?)';/;
const fromRegExp = /var ly = '(.*?)'/;
const authorRegExp = /var wz = '(.*?)'/;
const timeRegExp =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+时间：(.*?)(?:&nbsp;)*?\s+<\/span>/;
const pageViewRegExp =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+阅览：(\d+)\s+<\/span>/;
const contentRegExp =
  /<div class="read" id="WBNR">\s+([\s\S]*?)\s+<\/div>\s+<p id="zrbj"/;

export const getNotice = ({
  noticeID,
}: NoticeOptions): Promise<NoticeResponse> => {
  try {
    const url = `${ACTION_SERVER}/page/viewNews?ID=${noticeID}`;

    return request<string>(url).then((responseText) => {
      const title = titleRegExp.exec(responseText)![1];
      const author = authorRegExp.exec(responseText)![1];
      const time = timeRegExp.exec(responseText)![1];
      const from = fromRegExp.exec(responseText)![1];
      const pageView = pageViewRegExp.exec(responseText)![1];
      const content = contentRegExp.exec(responseText)![1];

      return getRichTextNodes(content, {
        getLinkText: (link) =>
          link.startsWith(ACTION_SERVER) ||
          link.startsWith("https://my.webvpn.nenu.edu.cn")
            ? null
            : link,
        // TODO: Support image
        getImageSrc: () => null,
      }).then(
        (content) =>
          <NoticeSuccessResponse>{
            success: true,
            title,
            author,
            from,
            time,
            pageView: Number(pageView),
            content,
          },
      );
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return Promise.resolve(<AuthLoginFailedResponse>{
      success: false,
      msg: message,
    });
  }
};

export const getOnlineNotice = (
  options: NoticeOptions,
): Promise<NoticeResponse> =>
  request<NoticeResponse>(`${service}action/notice`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });
