import { logger } from "@mptool/all";

import type {
  PostCourseTableOptions,
  PostCourseTableResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { POST_SYSTEM_SERVER } from "../../login/index.js";

export const getPostCourseTable = (
  options: PostCourseTableOptions,
): Promise<PostCourseTableResponse> =>
  request<PostCourseTableResponse>("/post-system/course-table", {
    method: "POST",
    body: options,
    cookieScope: POST_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
