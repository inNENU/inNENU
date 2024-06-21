import { URLSearchParams, logger } from "@mptool/all";

import { withActionLogin } from "./login.js";
import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonListSuccessResponse,
} from "../utils/index.js";
import {
  ExpiredResponse,
  UnknownResponse,
  createService,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";

const NOTICE_LIST_QUERY_URL = `${ACTION_SERVER}/page/queryList`;

export type NoticeType = "news" | "notice";

export interface NoticeListOptions {
  /**
   * 类型
   *
   * @default "notice"
   */
  type?: "notice" | "news";
  /**
   * 每页尺寸
   *
   * @default 20
   */
  size?: number;
  /**
   * 当前页面
   *
   * @default 1
   */
  current?: number;
}

interface RawNoticeItem {
  LLCS: number;
  FBSJ: string;
  KEYWORDS_: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ID__: string;
  SFZD: string;
  FLAG: string;
  RN: number;
  CJBM: string;
  TYPE: "notice";
}

interface RawNoticeListData {
  data: RawNoticeItem[];
  pageIndex: number;
  totalPage: number;
  pageSize: number;
  totalCount: number;
}

export interface NoticeInfo {
  title: string;
  from: string;
  time: string;
  id: string;
}

const getNoticeItem = ({
  ID__: id,
  CJBM: from,
  KEYWORDS_: title,
  FBSJ: time,
}: RawNoticeItem): NoticeInfo => ({
  id,
  title,
  from,
  time,
});

export interface NoticeListSuccessResponse
  extends CommonListSuccessResponse<NoticeInfo[]> {
  size: number;
  count: number;
}

export type NoticeListResponse =
  | NoticeListSuccessResponse
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const getNoticeListLocal = async ({
  type = "notice",
  size = 20,
  current = 1,
}: NoticeListOptions = {}): Promise<NoticeListResponse> => {
  try {
    const {
      data: { data, pageIndex, pageSize, totalCount, totalPage },
      status,
    } = await request<RawNoticeListData>(NOTICE_LIST_QUERY_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({
        type,
        _search: "false",
        nd: Date.now().toString(),
        limit: size.toString(),
        page: current.toString(),
      }),
      redirect: "manual",
    });

    if (
      status === 302 ||
      // Note: On QQ the status code is 404
      status === 404 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(data))
    ) {
      return ExpiredResponse;
    }

    if (!data.length)
      throw new Error(`获取公告列表失败: ${JSON.stringify(data, null, 2)}`);

    return {
      success: true,
      data: data.map(getNoticeItem),
      count: totalCount,
      size: pageSize,
      current: pageIndex,
      total: totalPage,
    };
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

const getNoticeListOnline = (
  options: NoticeListOptions = {},
): Promise<NoticeListResponse> =>
  request<NoticeListResponse>("/action/notice-list", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取内网通知失败", data);

    return data;
  });

export const getNoticeList = withActionLogin(
  createService("notice-list", getNoticeListLocal, getNoticeListOnline),
);
