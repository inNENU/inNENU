import type { RichTextNode } from "../../../typings/node.js";
import type { CommonFailedResponse } from "../../../typings/response.js";

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
