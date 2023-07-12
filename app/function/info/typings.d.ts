import { type RichTextNode } from "../../../typings/node.js";
import { type CommonFailedResponse } from "../../../typings/response.js";

export interface MainInfoSuccessResponse {
  success: true;
  title: string;
  time: string;
  from?: string;
  author?: string;
  editor?: string;
  pageView: number;
  content: RichTextNode[];
}

export type MainInfoResponse = MainInfoSuccessResponse | CommonFailedResponse;

export type MainInfoType = "notice" | "news" | "academic";

export interface MainInfoListOptions {
  /** @default 1 */
  page?: number;
  totalPage?: number;
  type: MainInfoType;
}

export interface InfoItem {
  title: string;
  from: string;
  time: string;
  url: string;
  pageView: number;
}

export interface MainInfoListSuccessResponse {
  success: true;
  data: InfoItem[];
  page: number;
  totalPage: number;
}

export type MainInfoListResponse =
  | MainInfoListSuccessResponse
  | CommonFailedResponse;
