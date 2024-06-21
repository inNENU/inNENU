import { URLSearchParams } from "@mptool/all";

import type {
  RawUnderSelectClassItem,
  UnderSelectClassInfo,
} from "./typings.js";
import { getClasses } from "./utils.js";
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

interface RawUnderSelectedClassResponse {
  data: "";
  rows: RawUnderSelectClassItem[];
  total: number;
}

export type UnderSelectSelectedResponse =
  | CommonSuccessResponse<UnderSelectClassInfo[]>
  | CommonFailedResponse<ActionFailType.Unknown>;

const getUnderSelectedClassesLocal = async (
  link: string,
): Promise<UnderSelectSelectedResponse> => {
  try {
    const infoUrl = `${UNDER_STUDY_SERVER}${link}/yxkc`;

    const { data } = await request<RawUnderSelectedClassResponse>(infoUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        page: "1",
        row: "1000",
        sort: "kcrwdm",
        order: "asc",
      }),
    });

    if (typeof data === "string") throw new Error("获取数据失败");

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

const getUnderSelectedClassesOnline = async (
  link: string,
): Promise<UnderSelectSelectedResponse> =>
  request<UnderSelectSelectedResponse>("/under-study/select/selected", {
    method: "POST",
    body: { link },
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderSelectedClasses = withUnderStudyLogin(
  createService(
    "under-select-selected",
    getUnderSelectedClassesLocal,
    getUnderSelectedClassesOnline,
  ),
);
