import { logger } from "@mptool/all";

import type {
  UserCourseTableOptions,
  UserCourseTableResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { POST_SYSTEM_SERVER } from "../../login/index.js";

export const getPostCourseTable = (
  options: UserCourseTableOptions,
): Promise<UserCourseTableResponse> =>
  request<UserCourseTableResponse>(`${service}post-system/course-table`, {
    method: "POST",
    data: options,
    scope: POST_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
