import { URLSearchParams } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import type {
  CommonFailedResponse,
  CommonListSuccessResponse,
} from "../utils/index.js";
import { LoginFailType, createService } from "../utils/index.js";

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
  | CommonFailedResponse;

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

    if (status === 302)
      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录信息已过期，请重新登录",
      } as AuthLoginFailedResponse;

    if (data.length)
      return {
        success: true,
        data: data.map(getNoticeItem),
        count: totalCount,
        size: pageSize,
        current: pageIndex,
        total: totalPage,
      } as NoticeListSuccessResponse;

    throw new Error(`获取公告列表失败: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
};

const getNoticeListOnline = (
  options: NoticeListOptions = {},
): Promise<NoticeListResponse> =>
  request<NoticeListResponse>("/action/notice-list", {
    method: "POST",
    body: options,
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

export const getNoticeList = createService(
  "notice-list",
  getNoticeListLocal,
  getNoticeListOnline,
);
