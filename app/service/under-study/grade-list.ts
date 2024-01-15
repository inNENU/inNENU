// import { URLSearchParams } from "@mptool/all";

import { UNDER_STUDY_SERVER } from "./utils.js";
import { request } from "../../api/net.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
// import { LoginFailType } from "../loginFailTypes.js";

export interface UnderGradeListOptions {
  /** 查询时间 */
  time?: string;
}

// interface RawUnderGradeResultItem {
//   /** 修读学期 */
//   xnxqmc: string;
//   /** 课程名称 */
//   kcmc: string;
//   /** 课程英文名称 */
//   kcywmc: string;
//   /** 课程类别 */
//   kcdlmc: string;
//   /** 课程成绩文字 */
//   zcj: string;
//   /** 课程实际成绩 */
//   zcjfs: number;
//   /** 考试性质 */
//   ksxzmc: "正常考试" | "校际交流" | "补考";
//   /** 成绩方式 */
//   cjfsmc: "百分制" | "五级制";
//   /** 学分 */
//   xf: number;
//   /** 总学时 */
//   zxs: number;
//   /** 修读方式名称 */
//   xdfsmc: string;
//   /** 开课单位 */
//   kkbmmc: string;
//   /** 成绩标识 */
//   cjbzmc: string;

//   /** 学年学期代码 */
//   xnxqdm: string;
//   /** 课程编号 */
//   kcbh: string;
//   /** 课程平台编号 */
//   kcptbh: string;
//   /** 考试性质代码 */
//   ksxzdm: string;
//   /** 课程代码 */
//   kcdm: string;
//   /** 修读方式代码 */
//   xdfsdm: string;
//   /** 成绩代码 */
//   cjdm: string;
//   /** 考核分数代码 */
//   khfsdm: string;

//   /** 学生姓名 */
//   xsxm: string;
//   /** 学号 */
//   xsbh: string;
//   /** 学生代码 */
//   xsdm: string;

//   xsckcj: "0";
//   rownum_: number;
//   ismax: "1" | "0";
//   isactive: "1";
//   wpjbz: "";
//   kcflmc: "";
//   cjjd: "";
//   bz: "";
//   xsckcjbz: "";
//   kcrwdm: "";
//   wzc: "0";
//   wpj: "0";

//   xmmc: "";
//   rwdm: "";
//   wzcbz: "";
// }

// interface RawUnderGradeSuccessResult {
//   data: "";
//   rows: RawUnderGradeResultItem[];
//   total: number;
// }

// interface RawUnderGradeFailedResult {
//   code: number;
//   data: string;
//   message: string;
// }

// type RawUnderGradeResult =
//   | RawUnderGradeSuccessResult
//   | RawUnderGradeFailedResult;

export interface UnderGradeResult {
  /** 修读时间 */
  time: string;
  /** 课程 id */
  cid: string;
  /** 课程名称 */
  name: string;
  /** 分数 */
  grade: number;
  /** 成绩代码 */
  gradeCode: string;
  /** 分数文本 */
  gradeText: string;
  gradeType: "百分制" | "五级制";
  /** 课程类型 */
  courseType: string;
  /** 课程类型短称 */
  shortCourseType: string;
  /** 学时 */
  hours: number | null;
  /** 学分 */
  point: number;
  /** 成绩标识 */
  mark: string;
  /** 考试性质 */
  examType: "正常考试" | "校际交流" | "补考";
}

export interface UnderGradeListSuccessResponse {
  success: true;
  data: UnderGradeResult[];
}

export type UnderGradeListResponse =
  | UnderGradeListSuccessResponse
  | AuthLoginFailedResponse;

// const QUERY_URL = `${UNDER_STUDY_SERVER}/new/student/xskccj/kccjDatas`;

// const getGradeLists = (
//   records: RawUnderGradeResultItem[],
// ): UnderGradeResult[] =>
//   records.map(
//     ({
//       xnxqmc,
//       kcmc,
//       kcdlmc,
//       zcj,
//       zcjfs,
//       ksxzmc,
//       cjfsmc,
//       xf,
//       zxs,
//       xdfsmc,
//       kkbmmc,
//       cjdm,
//       cjbzmc,
//       kcptbh,
//     }) => ({
//       time: xnxqmc.replace(/^20/, "").replace(/季学期$/, ""),
//       cid: kcptbh,
//       name: kcmc,
//       grade: zcjfs,
//       gradeCode: cjdm,
//       gradeText: zcj,
//       gradeType: cjfsmc,
//       courseType: kcdlmc,
//       shortCourseType: xdfsmc,
//       office: kkbmmc,
//       hours: zxs,
//       point: xf,
//       mark: cjbzmc,
//       examType: ksxzmc,
//     }),
//   );

// export const getUnderGradeList = async ({
//   time = "",
// }: UnderGradeListOptions): Promise<UnderGradeListResponse> => {
//   try {
//     const { data } = await request<RawUnderGradeResult>(QUERY_URL, {
//       method: "POST",
//       headers: {
//         Accept: "application/json, text/javascript, */*; q=0.01",
//       },
//       body: new URLSearchParams({
//         xnxqdm: time,
//         source: "kccjlist",
//         primarySort: "cjdm desc",
//         page: "1",
//         rows: "150",
//         sort: "kcmc",
//         order: "asc",
//       }),
//     });

//     if ("code" in data) {
//       if (data.message === "尚未登录，请先登录")
//         return {
//           success: false,
//           type: LoginFailType.Expired,
//           msg: "登录过期，请重新登录",
//         };

//       return {
//         success: false,
//         type: LoginFailType.Unknown,
//         msg: data.message,
//       };
//     }

//     const gradeList = getGradeLists(data.rows);

//     return {
//       success: true,
//       data: gradeList,
//     };
//   } catch (err) {
//     const { message } = <Error>err;

//     console.error(err);

//     return {
//       success: false,
//       type: LoginFailType.Unknown,
//       msg: message,
//     };
//   }
// };

export const getOnlineUnderGradeList = async (
  options: UnderGradeListOptions,
): Promise<UnderGradeListResponse> =>
  request<UnderGradeListResponse>("/under-study/grade-list", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);
