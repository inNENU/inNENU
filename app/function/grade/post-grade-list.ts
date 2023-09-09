import { logger } from "@mptool/all";

import type { PostGradeListResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { POST_SYSTEM_SERVER } from "../../login/index.js";

export const getOnlinePostGradeList = (): Promise<PostGradeListResponse> =>
  request<PostGradeListResponse>(`${service}post-system/grade-list`, {
    method: "POST",
    scope: POST_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
