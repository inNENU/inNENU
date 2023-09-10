import { query } from "@mptool/all";

import type {
  NoticeItem,
  NoticeListOptions,
  NoticeListResponse,
  NoticeListSuccessResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { ACTION_SERVER, AuthLoginFailedResponse } from "../../login/index.js";

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

const getNoticeItem = ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ID__,
  CJBM,
  KEYWORDS_,
  FBSJ,
}: RawNoticeItem): NoticeItem => ({
  title: KEYWORDS_,
  id: ID__,
  time: FBSJ,
  from: CJBM,
});

export const getNoticeList = async ({
  limit = 20,
  page = 1,
  type = "notice",
}: NoticeListOptions): Promise<NoticeListResponse> => {
  try {
    const queryUrl = `${ACTION_SERVER}/page/queryList`;

    const { data, pageIndex, pageSize, totalCount, totalPage } =
      await request<RawNoticeListData>(queryUrl, {
        method: "POST",
        header: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        data: query.stringify({
          type,
          _search: "false",
          nd: new Date().getTime().toString(),
          limit: limit.toString(),
          page: page.toString(),
        }),
      });

    if (data.length)
      return <NoticeListSuccessResponse>{
        success: true,
        data: data.map(getNoticeItem),
        pageIndex,
        pageSize,
        totalCount,
        totalPage,
      };

    return <AuthLoginFailedResponse>{
      success: false,
      msg: JSON.stringify(data),
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

export const getOnlineNoticeList = (
  options: NoticeListOptions,
): Promise<NoticeListResponse> =>
  request<NoticeListResponse>(`${service}action/notice-list`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });
