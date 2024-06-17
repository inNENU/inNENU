import { UNDER_STUDY_SERVER } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  AuthLoginFailedResponse,
  CommonFailedResponse,
} from "../../../../service/index.js";
import { ActionFailType, createService } from "../../../../service/index.js";

interface RawUnderGradeDetailItem {
  /** 总成绩 */
  zcj: string;

  /** 成绩 1 百分比 */
  bl1: number;
  /** 成绩 2 百分比 */
  bl2: number;
  /** 成绩 3 百分比 */
  bl3: number;
  /** 成绩 4 百分比 */
  bl4: number;
  /** 成绩 5 百分比 */
  bl5: number;

  /** 成绩 1 名称 */
  bl1mc: string;
  /** 成绩 2 名称 */
  bl2mc: string;
  /** 成绩 3 名称 */
  bl3mc: string;
  /** 成绩 4 名称 */
  bl4mc: string;
  /** 成绩 5 名称 */
  bl5mc: string;

  /** 成绩 1 */
  cj1: number | "";
  /** 成绩 2 */
  cj2: number | "";
  /** 成绩 3 */
  cj3: number | "";
  /** 成绩 4 */
  cj4: number | "";
  /** 成绩 5 */
  cj5: number | "";

  /** 开课单位 */
  kkbmmc: string;

  kkjysmc: "";
  isrk: "";
}

interface RawUnderGradeSuccessResult {
  code: 0;
  data: RawUnderGradeDetailItem[];
  message: string;
}

interface RawUnderGradeFailedResult {
  code: number;
  data: unknown;
  message: string;
}

type RawUnderGradeResult =
  | RawUnderGradeSuccessResult
  | RawUnderGradeFailedResult;

export interface UnderScoreDetail {
  /** 名称 */
  name: string;
  /** 分数 */
  score: number;
  /** 百分比 */
  percent: number;
}

export interface UnderGradeDetailSuccessResponse {
  success: true;
  data: UnderScoreDetail[];
}

export type UnderGradeDetailResponse =
  | UnderGradeDetailSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse<ActionFailType.Expired>;

const getGradeDetail = ({
  cj1,
  cj2,
  cj3,
  cj4,
  cj5,
  bl1,
  bl2,
  bl3,
  bl4,
  bl5,
  bl1mc,
  bl2mc,
  bl3mc,
  bl4mc,
  bl5mc,
}: RawUnderGradeDetailItem): UnderScoreDetail[] => {
  const results: UnderScoreDetail[] = [];

  if (bl1 > 0) results.push({ name: bl1mc, score: Number(cj1), percent: bl1 });
  if (bl2 > 0) results.push({ name: bl2mc, score: Number(cj2), percent: bl2 });
  if (bl3 > 0) results.push({ name: bl3mc, score: Number(cj3), percent: bl3 });
  if (bl4 > 0) results.push({ name: bl4mc, score: Number(cj4), percent: bl4 });
  if (bl5 > 0) results.push({ name: bl5mc, score: Number(cj5), percent: bl5 });

  return results;
};

const getUnderGradeDetailLocal = async (
  gradeCode: string,
): Promise<UnderGradeDetailResponse> => {
  try {
    const queryUrl = `${UNDER_STUDY_SERVER}/new/student/xskccj/getDetail?cjdm=${gradeCode}`;

    const { data, headers } = await request<RawUnderGradeResult>(queryUrl);

    if (headers.get("content-type")?.includes("text/html")) {
      console.log(data);

      throw new Error("获取失败");
    }

    if (data.code === 0) {
      const gradeDetail = getGradeDetail(
        (data.data as RawUnderGradeDetailItem[])[0],
      );

      return {
        success: true,
        data: gradeDetail,
      };
    }

    if (data.message === "尚未登录，请先登录")
      return {
        success: false,
        type: ActionFailType.Expired,
        msg: "登录过期，请重新登录",
      };

    return {
      success: false,
      msg: data.message,
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

const getUnderGradeDetailOnline = async (
  gradeCode: string,
): Promise<UnderGradeDetailResponse> =>
  request<UnderGradeDetailResponse>("/under-study/grade-detail", {
    method: "POST",
    body: { gradeCode },
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderGradeDetail = createService(
  "under-grade-detail",
  getUnderGradeDetailLocal,
  getUnderGradeDetailOnline,
);
