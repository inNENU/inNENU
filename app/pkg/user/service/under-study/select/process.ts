import { URLSearchParams } from "@mptool/all";

import { request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import {
  ActionFailType,
  UnknownResponse,
  createService,
} from "../../../../../service/index.js";
import { withUnderStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

export interface UnderSelectAddOptions {
  type: "add";
  /** 课程分类链接 */
  link: string;
  /** 班级 ID */
  classId: string;

  /** 课程名称 */
  name?: string;
  /** 课程 ID */
  courseId?: string;
  /**
   * 权重
   *
   * @default -1
   */
  weight?: number;
}

export interface UnderSelectRemoveOptions {
  type: "remove";
  /** 课程分类链接 */
  link: string;
  /** 班级 ID */
  classId: string;

  /** 课程名称 */
  name?: string;
  /** 课程 ID */
  courseId?: string;
  /** 班级代码 */
  classCode?: string;
}

export type UnderSelectProcessOptions =
  | UnderSelectAddOptions
  | UnderSelectRemoveOptions;

interface RawUnderSelectProcessSuccessResponse {
  data: "";
  code: 0;
  message: string;
}

interface RawUnderSelectProcessFailResponse {
  data: "";
  code: -1;
  message: string;
}

type RawUnderSelectProcessResponse =
  | RawUnderSelectProcessSuccessResponse
  | RawUnderSelectProcessFailResponse;

export interface UnderSelectProcessSuccessResponse {
  success: true;
}

export type UnderSelectProcessResponse =
  | UnderSelectProcessSuccessResponse
  | CommonFailedResponse<
      ActionFailType.Closed | ActionFailType.Full | ActionFailType.Unknown
    >;

const processUnderSelectLocal = async (
  options: UnderSelectProcessOptions,
): Promise<UnderSelectProcessResponse> => {
  try {
    const { type, link, classId } = options;

    const referer = `${UNDER_STUDY_SERVER}${link}`;

    if (type === "remove") {
      const { data } = await request<RawUnderSelectProcessResponse>(
        `${referer}/cancel`,
        {
          method: "POST",
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
          },
          body: new URLSearchParams({
            jxbdm: options.classCode ?? "",
            kcrwdm: options.classId,
            kcmc: options.name ?? "",
          }),
        },
      );

      if (data.code !== 0) {
        if (data.code === -1 && data.message === "当前不是选课时间")
          return {
            success: false,
            msg: data.message,
            type: ActionFailType.Closed,
          };

        // TODO: Add forbidden type

        throw new Error(data.message);
      }

      return {
        success: true,
      };
    }

    const { data } = await request<RawUnderSelectProcessResponse>(
      `${referer}/add`,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        body: new URLSearchParams({
          kcmc: options.name ?? "",
          kcrwdm: classId,
          qz: String(options.weight ?? -1),
          // NOTE: This is an unknown field, and currently can be omitted
          hlct: "0",
        }),
      },
    );

    if (data.code !== 0) {
      if (data.code === -1 && data.message === "当前不是选课时间")
        return {
          success: false,
          msg: data.message,
          type: ActionFailType.Closed,
        };

      if (data.message === "选课人数超出，请选其他课程") {
        return {
          success: false,
          msg: data.message,
          type: ActionFailType.Full,
        };
      }

      throw new Error(data.message);
    }

    return {
      success: true,
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return UnknownResponse(message);
  }
};

const processUnderSelectOnline = async (
  options: UnderSelectProcessOptions,
): Promise<UnderSelectProcessResponse> =>
  request<UnderSelectProcessResponse>("/under-study/select/process", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const processUnderSelect = withUnderStudyLogin(
  createService(
    "under-select-process",
    processUnderSelectLocal,
    processUnderSelectOnline,
  ),
);
