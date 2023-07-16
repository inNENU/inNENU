import { logger, query } from "@mptool/all";

import {
  type TableItem,
  type UserCourseTableOptions,
  type UserCourseTableResponse,
  UserCourseTableSuccessResponse,
} from "./typings.js";
import { AuthLoginFailedResponse } from "../../api/login/typings.js";
import { UNDER_SYSTEM_SERVER } from "../../api/login/under-course.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { getIETimeStamp } from "../../utils/browser.js";
import { getJSON } from "../../utils/json.js";

const courseRowRegExp =
  /<tr>\s+<td[^>]*>\s+\d+\s+<\/td>\s+((?:<td[^>]*>[\s\S]+?<\/td>\s*?)+)\s+<\/tr>/g;
const courseCellRegExp =
  /<td .*?>\s+<div id="\d-\d-\d"\s?>([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /<a[^>]*?>(\S+?)<br>(\S+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(\S+?)<br><br>\s*<\/a>/g;

const getCourses = (content: string): TableItem =>
  [...content.matchAll(courseRowRegExp)].map(([, rowContent]) =>
    [...rowContent.matchAll(courseCellRegExp)].map(([, cell]) =>
      [...cell.matchAll(classRegExp)].map(
        ([, name, teacher, time, location]) => ({
          name,
          teacher,
          time,
          location,
        }),
      ),
    ),
  );

export const getCourseTable = ({
  time,
}: UserCourseTableOptions): Promise<UserCourseTableResponse> => {
  try {
    return getJSON<Record<string, string>>(
      "function/data/semester-start-time",
    ).then((semesterStartTime) => {
      const params = {
        method: "goListKbByXs",
        istsxx: "no",
        xnxqh: time,
        zc: "",
      };

      const url = `${UNDER_SYSTEM_SERVER}/tkglAction.do?${query.stringify(
        params,
      )}`;

      return request<string>(url, {
        header: {
          Referer: `${UNDER_SYSTEM_SERVER}/tkglAction.do?method=kbxxXs&tktime=${getIETimeStamp()}`,
        },
      }).then((content) => {
        const tableData = getCourses(content);

        return <UserCourseTableSuccessResponse>{
          success: true,
          data: tableData,
          startTime: semesterStartTime[time],
        };
      });
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return Promise.resolve(<AuthLoginFailedResponse>{
      success: false,
      msg: message,
    });
  }
};

export const getOnlineCourseTable = (
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
