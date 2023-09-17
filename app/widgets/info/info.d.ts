import type { RichTextNode } from "../../function/utils/parser.js";

export type InfoType = "notice" | "news" | "academic";

export interface MainInfo {
  title: string;
  time: string;
  from?: string;
  author?: string;
  editor?: string;
  pageView: number;
  content: RichTextNode[];
}

export interface StarredInfo extends MainInfo {
  url: string;
  type: InfoType;
}
