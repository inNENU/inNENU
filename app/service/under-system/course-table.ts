import { URLSearchParams, logger } from "@mptool/all";

import { UNDER_SYSTEM_SERVER } from "./utils.js";
import { CommonFailedResponse } from "../../../typings/response.js";
import { cookieStore, request } from "../../api/index.js";
import type { ClassItem, TableItem } from "../../function/course/typings.js";
import { getJSON } from "../../utils/json.js";
import { LoginFailType, isWebVPNPage } from "../index.js";

const courseRowRegExp =
  /<tr>\s+<td[^>]*>\s+\d+\s+<\/td>\s+((?:<td[^>]*>[\s\S]+?<\/td>\s*?)+)\s+<\/tr>/g;
const courseCellRegExp =
  /<td .*?>\s+<div id="\d-\d-\d"\s?>([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /<a[^>]*?>(\S+?)\s*<br>(\S+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(\S+?)<br><br>\s*<\/a>/g;

const getCourses = (content: string): TableItem =>
  [...content.matchAll(courseRowRegExp)].map(([, rowContent]) =>
    [...rowContent.matchAll(courseCellRegExp)].map(([, cell]) => {
      const classMap: Record<string, ClassItem[]> = {};

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
  data: TableItem;
  startTime: string;
}

export type UnderCourseTableFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type UnderCourseTableResponse =
  | UnderCourseTableSuccessResponse
  | UnderCourseTableFailedResponse;

export const getUnderCourseTable = async ({
  time,
}: UnderCourseTableOptions): Promise<UnderCourseTableResponse> => {
  try {
    const semesterStartTime = await getJSON<Record<string, string>>(
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
    const { message } = <Error>err;

    console.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

export const getOnlineUnderCourseTable = (
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