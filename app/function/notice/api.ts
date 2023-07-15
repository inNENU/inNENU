import {
  type NoticeListOptions,
  type NoticeListResponse,
  type NoticeOptions,
  type NoticeResponse,
} from "./typings.js";
import { ACTION_SERVER } from "../../api/login/action.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getNotice = (options: NoticeOptions): Promise<NoticeResponse> =>
  request<NoticeResponse>(`${service}action/notice`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });

export const getNoticeList = (
  options: NoticeListOptions,
): Promise<NoticeListResponse> =>
  request<NoticeListResponse>(`${service}action/notice-list`, {
    method: "POST",
    data: options,
    scope: ACTION_SERVER,
  });
