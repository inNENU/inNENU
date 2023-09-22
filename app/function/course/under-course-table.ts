import { logger, query } from "@mptool/all";

import type {
  ClassItem,
  TableItem,
  UnderCourseTableOptions,
  UnderCourseTableResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../login/index.js";
import { cookieStore } from "../../utils/cookie.js";
import { getJSON } from "../../utils/json.js";

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

export const getUnderCourseTable = async ({
  time,
}: UnderCourseTableOptions): Promise<UnderCourseTableResponse> => {
  try {
    const semesterStartTime = await getJSON<Record<string, string>>(
      "function/data/semester-start-time",
    );
    const params = {
      method: "goListKbByXs",
      istsxx: "no",
      xnxqh: time,
      zc: "",
    };

    const content = await request<string>(
      `${UNDER_SYSTEM_SERVER}/tkglAction.do?${query.stringify(params)}`,
    );

    if (isWebVPNPage(content)) {
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
  request<UnderCourseTableResponse>(`${service}under-system/course-table`, {
    method: "POST",
    data: options,
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
