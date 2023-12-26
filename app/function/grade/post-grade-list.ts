import { logger } from "@mptool/all";

import type { PostGradeListResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { POST_SYSTEM_SERVER } from "../../login/index.js";

export const getOnlinePostGradeList = (): Promise<PostGradeListResponse> =>
  request<PostGradeListResponse>("/post-system/grade-list", {
    method: "POST",
    cookieScope: POST_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
