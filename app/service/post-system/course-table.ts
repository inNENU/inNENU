import { URLSearchParams, logger } from "@mptool/all";

import { POST_SYSTEM_HTTPS_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/index.js";
import type { ClassItem, TableItem } from "../../function/course/typings.js";
import { getJSON } from "../../utils/json.js";
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

const courseRowRegExp =
  /<tr>\s+<td[^>]*>\s+\d+\s+<\/td>\s+((?:<td[^>]*>[\s\S]+?<\/td>\s*?)+)\s+<\/tr>/g;
const courseCellRegExp =
  /<td .*?>[\s\S]+?<div id="\d-\d-\d"\s+style="display: none;"\s?>(?:&nbsp;)*([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /(\S+?)<br>(?:\S+?)<br>(\S+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(\S+?)<br>\s*/g;

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

export interface PostCourseTableOptions {
  /** 查询时间 */
  time: string;
}

export interface PostCourseTableSuccessResponse {
  success: true;
  data: TableItem;
  startTime: string;
}

export type PostCourseTableFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type PostCourseTableResponse =
  | PostCourseTableSuccessResponse
  | PostCourseTableFailedResponse;

export const getPostCourseTable = async ({
  time,
}: PostCourseTableOptions): Promise<PostCourseTableResponse> => {
  try {
    const semesterStartTime = await getJSON<Record<string, string>>(
      "function/data/semester-start-time",
    );

    const QUERY_URL = `${POST_SYSTEM_HTTPS_SERVER}/tkglAction.do?${new URLSearchParams(
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

    return <PostCourseTableSuccessResponse>{
      success: true,
      data: tableData,
      startTime: semesterStartTime[time],
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return <CommonFailedResponse>{
      success: false,
      msg: message,
    };
  }
};

export const getOnlinePostCourseTable = (
  options: PostCourseTableOptions,
): Promise<PostCourseTableResponse> =>
  request<PostCourseTableResponse>("/post-system/course-table", {
    method: "POST",
    body: options,
    cookieScope: POST_SYSTEM_HTTPS_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
