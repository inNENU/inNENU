import { type CookieOptions } from "../../../typings/cookie.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { type AccountBasicInfo } from "../../utils/app.ts";

export type NoticeListOptions = (AccountBasicInfo | CookieOptions) & {
  limit: number;
  page: number;
};

export interface NoticeItem {
  title: string;
  from: string;
  time: string;
  id: string;
}

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

export type NoticeOptions = (AccountBasicInfo | CookieOptions) & {
  noticeID: string;
};

export interface NoticeSuccessResponse {
  success: true;
  title: string;
  author: string;
  time: string;
  from: string;
  pageView: number;
  content: string;
}

export type NoticeResponse = NoticeSuccessResponse | CommonFailedResponse;
