import { URLSearchParams, logger } from "@mptool/all";

import { UNDER_SYSTEM_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../../../typings/response.js";
import { cookieStore, request } from "../../../../api/index.js";
import {
  LoginFailType,
  createService,
  isWebVPNPage,
} from "../../../../service/index.js";
import type {
  CourseTableClassData,
  CourseTableData,
} from "../../../../state/index.js";
import { getJson } from "../../../../utils/index.js";

const courseRowRegExp =
  /<tr>\s+<td[^>]*>\s+\d+\s+<\/td>\s+((?:<td[^>]*>[\s\S]+?<\/td>\s*?)+)\s+<\/tr>/g;
const courseCellRegExp =
  /<td .*?>\s+<div id="\d-\d-\d"\s?>([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /<a[^>]*?>(.+?)\s*<br>(.+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(.+?)<br><br>\s*<\/a>/g;

const getCourses = (content: string): CourseTableData =>
  [...content.matchAll(courseRowRegExp)].map(([, rowContent]) =>
    [...rowContent.matchAll(courseCellRegExp)].map(([, cell]) => {
      const classMap: Record<string, CourseTableClassData[]> = {};

      [...cell.matchAll(classRegExp)]
        .map(([, name, teacher, time, location]) => ({
          name,
          teacher,
          time,
          location,
        }))
        .forEach((item) => {
          (classMap[item.name] ??= []).push(item);
        });

      return Object.values(classMap).map((classes) => ({
        name: classes[0].name,
        location: classes[0].location,
        teacher: classes.map((item) => item.teacher).join("、"),
        time: classes.map((item) => item.time).join("、"),
      }));
    }),
  );

export interface UnderCourseTableOptions {
  /** 查询时间 */
  time: string;
}

export interface UnderCourseTableSuccessResponse {
  success: true;
  data: CourseTableData;
  startTime: string;
}

export type UnderCourseTableFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type UnderCourseTableResponse =
  | UnderCourseTableSuccessResponse
  | UnderCourseTableFailedResponse;

const getUnderCourseTableLocal = async ({
  time,
}: UnderCourseTableOptions): Promise<UnderCourseTableResponse> => {
  try {
    const semesterStartTime = await getJson<Record<string, string>>(
      "function/data/semester-start-time",
    );
    const QUERY_URL = `${UNDER_SYSTEM_SERVER}/tkglAction.do?${new URLSearchParams(
      {
        method: "goListKbByXs",
        istsxx: "no",
        xnxqh: time,
        zc: "",
      },
    ).toString()}`;

    const { data: content, status } = await request<string>(QUERY_URL, {
      redirect: "manual",
    });

    if (status === 302 || isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重试",
      };
    }

    if (content.includes("评教未完成，不能查看课表！"))
      return {
        success: false,
        msg: "上学期评教未完成，不能查看本学期课表",
      };

    const tableData = getCourses(content);

    return {
      success: true,
      data: tableData,
      startTime: semesterStartTime[time],
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

const getUnderCourseTableOnline = (
  options: UnderCourseTableOptions,
): Promise<UnderCourseTableResponse> =>
  request<UnderCourseTableResponse>("/under-system/course-table", {
    method: "POST",
    body: options,
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getUnderCourseTable = createService(
  "course-table",
  getUnderCourseTableLocal,
  getUnderCourseTableOnline,
);
