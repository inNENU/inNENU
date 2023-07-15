import { logger } from "@mptool/all";

import {
  type UserCourseTableOptions,
  type UserCourseTableResponse,
  type UserGradeListOptions,
  type UserGradeListResponse,
} from "./typings.js";
import { UNDER_SYSTEM_SERVER } from "../../api/login/under-course.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getCourseTable = (
  options: UserCourseTableOptions,
): Promise<UserCourseTableResponse> =>
  request<UserCourseTableResponse>(`${service}under-system/course-table`, {
    method: "POST",
    data: options,
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getGradeList = (
  options: UserGradeListOptions,
): Promise<UserGradeListResponse> =>
  request<UserGradeListResponse>(`${service}under-system/grade-list`, {
    method: "POST",
    data: options,
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
