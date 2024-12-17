/* eslint-disable @typescript-eslint/no-deprecated */
import { URLSearchParams, logger } from "@mptool/all";

import { UNDER_SYSTEM_SERVER } from "./utils.js";
import { cookieStore, request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
} from "../../../../service/index.js";
import {
  ExpiredResponse,
  createService,
  isWebVPNPage,
} from "../../../../service/index.js";
import type {
  LegacyCourseTableClassData,
  LegacyCourseTableData,
} from "../../../../state/index.js";
import { getJson } from "../../../../utils/index.js";

const courseRowRegExp =
  /<tr>\s+<td[^>]*>\s+\d+\s+<\/td>\s+((?:<td[^>]*>[\s\S]+?<\/td>\s*?)+)\s+<\/tr>/g;
const courseCellRegExp =
  /<td .*?>\s+<div id="\d-\d-\d"\s?>([\s\S]+?)<\/div>[\s\S]+?<\/td>/g;

const classRegExp =
  /<a[^>]*?>(.+?)\s*<br>(.+?)<br>\s*<nobr>\s*(\S+?)<nobr><br>(.+?)<br><br>\s*<\/a>/g;

const getWeekRange = (timeText: string): number[] => {
  const match = Array.from(timeText.matchAll(/([\d,-]+)[^\d]*周/g));

  return match
    .map(([, time]) =>
      time.split(",").map((item) => {
        const range = item.split("-").map(Number);

        if (range.length === 1) return range;

        return Array.from(
          { length: range[1] - range[0] + 1 },
          (_, index) => index + range[0],
        );
      }),
    )
    .flat(2);
};

const getClassIndex = (timeText: string): [number, number] => {
  const match = Array.from(timeText.matchAll(/\[(\d+)-(\d+)节\]/g));

  return match
    .map(([, startIndex, endIndex]) => [Number(startIndex), Number(endIndex)])
    .flat(2) as [number, number];
};

const getLegacyCourses = (content: string): LegacyCourseTableData =>
  [...content.matchAll(courseRowRegExp)].map(([, rowContent]) =>
    [...rowContent.matchAll(courseCellRegExp)].map(([, cell]) => {
      const result: (Omit<
        LegacyCourseTableClassData,
        "teacher" | "location" | "locations"
      > & {
        locations: Record<string, string>;
      })[] = [];

      [...cell.matchAll(classRegExp)].forEach(
        ([, name, teacher, time, location]) => {
          const weeks = getWeekRange(time);
          const locations = Object.fromEntries(
            new Array(weeks.length)
              .fill(null)
              .map((_, i) => [weeks[i].toString(), location]),
          );
          const existingClass = result.find((item) => item.name === name);

          if (existingClass) {
            existingClass.weeks.push(...weeks);
            existingClass.locations = {
              ...existingClass.locations,
              ...locations,
            };
          }

          result.push({
            name,
            teachers: [teacher],
            time,
            locations,
            weeks: getWeekRange(time),
            classIndex: getClassIndex(time),
          });
        },
      );

      return result.map(({ weeks, ...item }) => {
        const locations = weeks.map((week) => item.locations[week.toString()]);

        return {
          ...item,
          teacher: item.teachers.join("，"),
          weeks: weeks.sort((a, b) => a - b),
          locations,
          location: Array.from(new Set(locations)).join("，"),
        };
      });
    }),
  );

/** @deprecated */
export interface LegacyUnderCourseTableSuccessResponse {
  success: true;
  data: {
    table: LegacyCourseTableData;
    startTime: string;
  };
}

/** @deprecated */
export type LegacyUnderCourseTableFailedResponse =
  CommonFailedResponse<ActionFailType.Expired>;

/** @deprecated */
export type LegacyUnderCourseTableResponse =
  | LegacyUnderCourseTableSuccessResponse
  | LegacyUnderCourseTableFailedResponse;

/** @deprecated */
const getLegacyUnderCourseTableLocal = async (
  time: string,
): Promise<LegacyUnderCourseTableResponse> => {
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

      return ExpiredResponse;
    }

    if (content.includes("评教未完成，不能查看课表！"))
      return {
        success: false,
        msg: "上学期评教未完成，不能查看本学期课表",
      };

    const tableData = getLegacyCourses(content);

    return {
      success: true,
      data: {
        table: tableData,
        startTime: semesterStartTime[time],
      },
    };
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

/** @deprecated */
const getLegacyUnderCourseTableOnline = (
  time: string,
): Promise<LegacyUnderCourseTableResponse> =>
  request<LegacyUnderCourseTableResponse>("/under-system/course-table", {
    method: "POST",
    body: { time },
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

/** @deprecated */
export const getLegacyUnderCourseTable = createService(
  "under-course-table-old",
  getLegacyUnderCourseTableLocal,
  getLegacyUnderCourseTableOnline,
);
