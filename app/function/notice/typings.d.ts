import { type RichTextNode } from "../../../typings/node.js";
import { type CommonFailedResponse } from "../../../typings/response.js";

export interface NoticeListOptions {
  /** @default 20 */
  limit?: number;
  /** @default 1 */
  page?: number;
  /** @default "notice" */
  type?: "notice" | "news";
}

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
