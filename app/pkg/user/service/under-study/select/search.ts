import { URLSearchParams } from "@mptool/all";

import type {
  RawUnderSearchClassResponse,
  UnderSelectCourseInfo,
} from "./typings.js";
import { getCourses } from "./utils.js";
import { request } from "../../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import {
  UnknownResponse,
  createService,
} from "../../../../../service/index.js";
import { withUnderStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

export interface UnderSelectSearchOptions {
  /** 课程分类链接 */
  link: string;
  /** 课程名称 */
  name?: string;
  /** 校区 */
  area?: string;
  /** 年级 */
  grade?: number;
  /** 专业 */
  major?: string;
  /** 课程类别 */
  type?: string;
  /** 课程分类 */
  category?: string;
  /** 周次 */
  week?: string;
  /** 节次 */
  classIndex?: string;
  /** 教师 */
  teacher?: string;
  /** 地点 */
  place?: string;
  /** 开课单位 */
  office?: string;
}

export type UnderSelectSearchResponse =
  | CommonSuccessResponse<UnderSelectCourseInfo[]>
  | CommonFailedResponse<ActionFailType.Unknown>;

const searchUnderCoursesLocal = async ({
  link = "",
  name = "",
  area = "",
  grade,
  major = "",
  type = "",
  category = "",
  week = "",
  classIndex = "",
  teacher = "",
  place = "",
  office = "",
}: UnderSelectSearchOptions): Promise<UnderSelectSearchResponse> => {
  try {
    if (!link) throw new Error(`"link" is required`);

    const infoUrl = `${UNDER_STUDY_SERVER}${link}/hzkc`;

    const { data } = await request<RawUnderSearchClassResponse>(infoUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        kkyxdm: office,
        xqdm: area,
        nd: (grade || "").toString(),
        zydm: major,
        kcdldm: type,
        xq: week,
        jc: classIndex,
        kcxx: name,
        kcfl: category,
        jxcdmc: place,
        teaxm: teacher,
        page: "1",
        row: "1000",
        sort: "kcrwdm",
        order: "asc",
      }),
    });

    if (typeof data === "string") throw new Error("获取数据失败");

    return {
      success: true,
      data: getCourses(data.rows),
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return UnknownResponse(message);
  }
};

const searchUnderCoursesOnline = async (
  options: UnderSelectSearchOptions,
): Promise<UnderSelectSearchResponse> =>
  request<UnderSelectSearchResponse>("/under-study/select/search", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const searchUnderCourses = withUnderStudyLogin(
  createService(
    "under-select-search",
    searchUnderCoursesLocal,
    searchUnderCoursesOnline,
  ),
);
