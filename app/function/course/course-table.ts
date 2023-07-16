import { logger, query } from "@mptool/all";

import {
  type TableItem,
  type UserCourseTableOptions,
  type UserCourseTableResponse,
  UserCourseTableSuccessResponse,
} from "./typings.js";
import {
  AuthLoginFailedResponse,
  UNDER_SYSTEM_SERVER,
  request,
} from "../../api/index.js";
import { service } from "../../config/index.js";
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

export const getCourseTable = async ({
  time,
}: UserCourseTableOptions): Promise<UserCourseTableResponse> => {
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
      {
        header: {
          Referer: `${UNDER_SYSTEM_SERVER}/tkglAction.do?method=kbxxXs&tktime=${getIETimeStamp()}`,
        },
      },
    );

    const tableData = getCourses(content);

    return <UserCourseTableSuccessResponse>{
      success: true,
      data: tableData,
      startTime: semesterStartTime[time],
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return <AuthLoginFailedResponse>{
      success: false,
      msg: message,
    };
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
