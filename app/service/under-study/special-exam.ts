// import { URLSearchParams } from "@mptool/all";

import { UNDER_STUDY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/net.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
// import { LoginFailType } from "../loginFailTypes.js";

// interface RawUnderSpecialExamItem {
//   /** 考试成绩 */
//   zcj: number;
//   /** 考试时间 */
//   kssj: string;
//   /** 修读学期 */
//   xnxqmc: string;
//   /** 考试名称 */
//   kjkcmc: string;
//   /** 考试成绩代码 */
//   kjcjdm: string;

//   /** 学院 */
//   xsyxmc: string;
//   /** 学制 */
//   xz: number;
//   /** 培养类别 */
//   pyccmc: string;
//   /** 专业名称 */
//   zymc: string;
//   /** 班级 */
//   bjmc: string;
//   /** 身份证号 */
//   sfzh: string;

//   kjkcbh: string;
//   rownum_: number;
//   zkzh: "";
//   cjbzmc: "";
//   xm1cj: "";
//   xm2cj: "";
//   xm3cj: "";
//   xm4cj: "";
//   xm5cj: "";
//   djmc: "";
//   bz: "";
// }

// interface RawUnderSpecialExamSuccessResult {
//   data: "";
//   rows: RawUnderSpecialExamItem[];
//   total: number;
// }

// interface RawUnderSpecialExamFailedResult {
//   code: number;
//   data: string;
//   message: string;
// }

// type RawUnderSpecialExamResult =
//   | RawUnderSpecialExamSuccessResult
//   | RawUnderSpecialExamFailedResult;

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
  | AuthLoginFailedResponse
  | CommonFailedResponse;

// const QUERY_URL = `${UNDER_STUDY_SERVER}/new/student/xskjcj/datas`;

// const getSpecialExamResults = (
//   records: RawUnderSpecialExamItem[],
// ): UnderSpecialExamResult[] =>
//   records.map(({ zcj, kssj, xnxqmc, kjkcmc, kjcjdm }) => ({
//     semester: xnxqmc.replace(/^20/, "").replace(/季学期$/, ""),
//     time: kssj,
//     name: kjkcmc,
//     grade: zcj,
//     gradeCode: kjcjdm,
//   }));

// export const getUnderSpecialExam =
//   async (): Promise<UnderSpecialExamResponse> => {
//     try {
//       const { data } = await request<RawUnderSpecialExamResult>(QUERY_URL, {
//         method: "POST",
//         headers: {
//           Accept: "application/json, text/javascript, */*; q=0.01",
//         },
//         body: new URLSearchParams({
//           page: "1",
//           rows: "50",
//           sort: "xnxqdm",
//           order: "asc",
//         }),
//       });

//       if ("code" in data) {
//         if (data.message === "尚未登录，请先登录")
//           return {
//             success: false,
//             type: LoginFailType.Expired,
//             msg: "登录过期，请重新登录",
//           };

//         return {
//           success: false,
//           msg: data.message,
//         };
//       }

//       const records = getSpecialExamResults(data.rows);

//       return {
//         success: true,
//         data: records,
//       };
//     } catch (err) {
//       const { message } = <Error>err;

//       console.error(err);

//       return {
//         success: false,
//         msg: message,
//       };
//     }
//   };

export const getOnlineUnderSpecialExam =
  async (): Promise<UnderSpecialExamResponse> =>
    request<UnderSpecialExamResponse>("/under-study/special-exam", {
      method: "POST",
      cookieScope: UNDER_STUDY_SERVER,
    }).then(({ data }) => data);
