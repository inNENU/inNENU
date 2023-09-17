import { RichTextNode } from "../../function/utils/parser.js";

export type NoticeType = "notice" | "news";

export interface NoticeInfo {
  title: string;
  author: string;
  time: string;
  from: string;
  pageView: number;
  content: RichTextNode[];
}

export interface StarredNotice extends NoticeInfo {
  id: string;
  type: NoticeType;
}
