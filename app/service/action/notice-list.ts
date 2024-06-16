import { URLSearchParams } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import type { CommonFailedResponse } from "../utils/index.js";
import { LoginFailType, createService } from "../utils/index.js";

const NOTICE_LIST_QUERY_URL = `${ACTION_SERVER}/page/queryList`;

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

export type NoticeType = "notice" | "news";

export interface NoticeListOptions {
  /** @default 20 */
  limit?: number;
  /** @default 1 */
  page?: number;
  /** @default "notice" */
  type?: NoticeType;
}

export interface NoticeItem {
  title: string;
  from: string;
  time: string;
  id: string;
}

const getNoticeItem = ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ID__,
  CJBM,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  KEYWORDS_,
  FBSJ,
}: RawNoticeItem): NoticeItem => ({
  title: KEYWORDS_,
  id: ID__,
  time: FBSJ,
  from: CJBM,
});

export interface NoticeListSuccessResponse {
  success: true;
  data: NoticeItem[];
  pageIndex: number;
  pageSize: number;
  totalPage: number;
  totalCount: number;
}

export type NoticeListResponse =
  | NoticeListSuccessResponse
  | CommonFailedResponse;

const getNoticeListLocal = async ({
  limit = 20,
  page = 1,
  type = "notice",
}: NoticeListOptions): Promise<NoticeListResponse> => {
  try {
    const {
      data: { data, pageIndex, pageSize, totalCount, totalPage },
      status,
    } = await request<RawNoticeListData>(NOTICE_LIST_QUERY_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        type,
        _search: "false",
        nd: new Date().getTime().toString(),
        limit: limit.toString(),
        page: page.toString(),
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
        pageIndex,
        pageSize,
        totalCount,
        totalPage,
      } as NoticeListSuccessResponse;

    return {
      success: false,
      msg: JSON.stringify(data),
    } as AuthLoginFailedResponse;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as AuthLoginFailedResponse;
  }
};

const getNoticeListOnline = (
  options: NoticeListOptions,
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
