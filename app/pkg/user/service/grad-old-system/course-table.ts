import { URLSearchParams, logger } from "@mptool/all";

import { GRAD_OLD_SYSTEM_HTTPS_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../../../typings/index.js";
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
  /<td .*?>[\s\S]+?<div id="\d-\d-\d"\s+style="display: none;"\s?>(?:&nbsp;)*([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /(.+?)<br>(?:.+?)<br>(.+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(.+?)<br>\s*/g;

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

export interface GradCourseTableOptions {
  /** 查询时间 */
  time: string;
}

export interface GradCourseTableSuccessResponse {
  success: true;
  data: CourseTableData;
  startTime: string;
}

export type GradCourseTableFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type GradCourseTableResponse =
  | GradCourseTableSuccessResponse
  | GradCourseTableFailedResponse;

const getGradCourseTableLocal = async ({
  time,
}: GradCourseTableOptions): Promise<GradCourseTableResponse> => {
  try {
    const semesterStartTime = await getJson<Record<string, string>>(
      "function/data/semester-start-time",
    );

    const QUERY_URL = `${GRAD_OLD_SYSTEM_HTTPS_SERVER}/tkglAction.do?${new URLSearchParams(
      {
        method: "goListKbByXs",
        xnxqh: time,
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

    const tableData = getCourses(content);

    if (content.includes("该学期无课表时间信息"))
      return {
        success: false,
        msg: "该学期无课表时间信息",
      };

    return {
      success: true,
      data: tableData,
      startTime: semesterStartTime[time],
    } as GradCourseTableSuccessResponse;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
};

const getGradCourseTableOnline = (
  options: GradCourseTableOptions,
): Promise<GradCourseTableResponse> =>
  request<GradCourseTableResponse>("/grad-old-system/course-table", {
    method: "POST",
    body: options,
    cookieScope: GRAD_OLD_SYSTEM_HTTPS_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getGradCourseTable = createService(
  "grad-course-table",
  getGradCourseTableLocal,
  getGradCourseTableOnline,
);
