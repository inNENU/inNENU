import { URLSearchParams } from "@mptool/all";

import type {
  RawUnderSearchClassResponse,
  UnderSelectClassInfo,
} from "./typings.js";
import { getClasses } from "./utils.js";
import { request } from "../../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import {
  UnknownResponse,
  createService,
} from "../../../../../service/index.js";
import { withUnderStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

export interface UnderSelectClassesOptions {
  /** 选课链接 */
  link: string;
  /** 课程 ID */
  courseId: string;
}

export type UnderSelectClassesResponse =
  | CommonSuccessResponse<UnderSelectClassInfo[]>
  | CommonFailedResponse;

const getUnderCourseClassesLocal = async ({
  courseId,
  link,
}: UnderSelectClassesOptions): Promise<UnderSelectClassesResponse> => {
  try {
    if (!link) throw new Error(`"link" is required!`);
    if (!courseId) throw new Error(`"courseId" is required!`);

    const infoUrl = `${UNDER_STUDY_SERVER}${link}/kxkc`;

    const { data } = await request<RawUnderSearchClassResponse>(infoUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        kcptdm: courseId,
        page: "1",
        row: "1000",
        sort: "kcrwdm",
        order: "asc",
      }),
    });

    if (typeof data === "string") {
      throw new Error("获取失败");
    }

    return {
      success: true,
      data: getClasses(data.rows),
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return UnknownResponse(message);
  }
};

const getUnderCourseClassesOnline = async (
  options: UnderSelectClassesOptions,
): Promise<UnderSelectClassesResponse> =>
  request<UnderSelectClassesResponse>("/under-study/select/class", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderCourseClasses = withUnderStudyLogin(
  createService(
    "under-select-class",
    getUnderCourseClassesLocal,
    getUnderCourseClassesOnline,
  ),
);
