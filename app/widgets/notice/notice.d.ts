import type { NoticeSuccessResponse } from "../../service/index.js";

export type NoticeType = "notice" | "news";

export interface StarredNotice extends Omit<NoticeSuccessResponse, "success"> {
  id: string;
  type: NoticeType;
}
