import { URLSearchParams, logger } from "@mptool/all";

import { UNDER_STUDY_SERVER } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
} from "../../../../service/index.js";
import { ExpiredResponse, createService } from "../../../../service/index.js";

interface RawUnderSpecialExamItem {
  /** 考试成绩 */
  zcj: number;
  /** 考试时间 */
  kssj: string;
  /** 修读学期 */
  xnxqmc: string;
  /** 考试名称 */
  kjkcmc: string;
  /** 考试成绩代码 */
  kjcjdm: string;

  /** 学院 */
  xsyxmc: string;
  /** 学制 */
  xz: number;
  /** 培养类别 */
  pyccmc: string;
  /** 专业名称 */
  zymc: string;
  /** 班级 */
  bjmc: string;
  /** 身份证号 */
  sfzh: string;

  kjkcbh: string;
  rownum_: number;
  zkzh: "";
  cjbzmc: "";
  xm1cj: "";
  xm2cj: "";
  xm3cj: "";
  xm4cj: "";
  xm5cj: "";
  djmc: "";
  bz: "";
}

interface RawUnderSpecialExamSuccessResult {
  data: "";
  rows: RawUnderSpecialExamItem[];
  total: number;
}

interface RawUnderSpecialExamFailedResult {
  code: number;
  data: string;
  message: string;
}

type RawUnderSpecialExamResult =
  | RawUnderSpecialExamSuccessResult
  | RawUnderSpecialExamFailedResult;

export interface UnderSpecialExamResult {
  /** 修复学期 */
  semester: string;
  /** 考试时间 */
  time: string;
  /** 考试名称 */
  name: string;
  /** 分数 */
  grade: number;
  /** 成绩代码 */
  gradeCode: string;
}

export interface UnderSpecialExamSuccessResponse {
  success: true;
  data: UnderSpecialExamResult[];
}

export type UnderSpecialExamResponse =
  | UnderSpecialExamSuccessResponse
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const QUERY_URL = `${UNDER_STUDY_SERVER}/new/student/xskjcj/datas`;

const getSpecialExamResults = (
  records: RawUnderSpecialExamItem[],
): UnderSpecialExamResult[] =>
  records.map(({ zcj, kssj, xnxqmc, kjkcmc, kjcjdm }) => ({
    semester: xnxqmc.replace(/^20/, "").replace(/季学期$/, ""),
    time: kssj,
    name: kjkcmc,
    grade: zcj,
    gradeCode: kjcjdm,
  }));

const getUnderSpecialExamLocal =
  async (): Promise<UnderSpecialExamResponse> => {
    try {
      const { data } = await request<RawUnderSpecialExamResult>(QUERY_URL, {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        body: new URLSearchParams({
          page: "1",
          rows: "50",
          sort: "xnxqdm",
          order: "asc",
        }),
      });

      if ("code" in data) {
        if (data.message === "尚未登录，请先登录") return ExpiredResponse;

        return {
          success: false,
          msg: data.message,
        };
      }

      const records = getSpecialExamResults(data.rows);

      return {
        success: true,
        data: records,
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

const getUnderSpecialExamOnline = async (): Promise<UnderSpecialExamResponse> =>
  request<UnderSpecialExamResponse>("/under-study/special-exam", {
    method: "POST",
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderSpecialExam = createService(
  "under-special-exam",
  getUnderSpecialExamLocal,
  getUnderSpecialExamOnline,
);
