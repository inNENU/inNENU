import { URLSearchParams, logger } from "@mptool/all";

import {
  UNDER_SYSTEM_SERVER,
  fieldRegExp,
  keyCodeRegExp,
  otherFieldsRegExp,
  printHQLInputRegExp,
  printHQLJSRegExp,
  printPageSizeRegExp,
  sqlStringRegExp,
  tableFieldsRegExp,
  totalPagesRegExp,
} from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/index.js";
import { getIETimeStamp } from "../../utils/browser.js";
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

const gradeItemRegExp = /<tr.+?class="smartTr"[^>]*?>([\s\S]*?)<\/tr>/g;
const jsGradeItemRegExp = /<tr.+?class=\\"smartTr\\"[^>]*?>(.*?)<\/tr>/g;
const gradeCellRegExp =
  /^(?:<td[^>]*?>[^<]*?<\/td>){3}<td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^>]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^>]*?)<\/td><td[^>]*?>(.*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td>/;
const gradeRegExp = /<a.*?JsMod\('([^']*?)'.*?>([^<]*?)<\/a>/;
const gradeDetailRegExp =
  /<tr.*class="smartTr"[^>]+><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><\/tr>/;

const sqlRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"isSql"\s+id\s*=\s*"isSql"\s+value="([^"]*?)">/;
const keyRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"key"\s+id\s*=\s*"key"\s+value="([^"]*?)">/;
const xsIdRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"xsId"\s+id\s*=\s*"xsId"\s+value="([^"]*?)" \/>/;

type UnderCourseType =
  | "通识教育必修课"
  | "通识教育选修课"
  | "专业教育必修课"
  | "专业教育选修课"
  | "教师职业教育必修课"
  | "教师职业教育选修课"
  | "任意选修课"
  | "发展方向课"
  | "教师教育必修课"
  | "教师教育选修课";

const COURSE_TYPES: Record<UnderCourseType, string> = {
  通识教育必修课: "01",
  通识教育选修课: "02",
  专业教育必修课: "03",
  专业教育选修课: "04",
  教师职业教育必修课: "05",
  教师职业教育选修课: "06",
  任意选修课: "09",
  发展方向课: "10",
  教师教育必修课: "11",
  教师教育选修课: "12",
};
const DEFAULT_TABLE_FIELD =
  "学号:1:1:90:a.xh,姓名:2:1:110:a.xm,开课学期:3:1:120:a.xqmc,课程编号:14:1:120:a.kcbh,课程名称:4:1:130:a.kcmc,难度系数:18:1:70:ndxs,总成绩:5:1:70:a.zcj,学分绩点:19:1:70:jd,成绩标志:6:1:90:cjbsmc,课程性质:7:1:110:kcxzmc,通选课类别:20:1:90:txklb,课程类别:8:1:90:kclbmc,学时:9:1:70:a.zxs,学分:10:1:70:a.xf,考试性质:11:1:100:ksxzmc,补重学期:15:1:100:a.bcxq,审核状态:17:1:100:shzt";
const DEFAULT_OTHER_FIELD = "null";
const QUERY_URL = `${UNDER_SYSTEM_SERVER}/xszqcjglAction.do?method=queryxscj`;

const getDisplayTime = (time: string): string => {
  const [startYear, endYear, semester] = time.split("-");

  return semester === "1"
    ? `${startYear.substring(2)}年秋`
    : `${endYear.substring(2)}年春`;
};

export interface ScoreDetail {
  score: number;
  percent: number;
}

export interface GradeDetail {
  usual: ScoreDetail[];
  exam: ScoreDetail | null;
}

export interface UnderGradeOldResult {
  /** 修读时间 */
  time: string;
  /** 课程 id */
  cid: string;
  /** 课程名称 */
  name: string;
  /** 难度系数 */
  difficulty: number;
  /** 分数 */
  grade: number;
  /** 分数文本 */
  gradeText: string | null;
  /** 分数详情 */
  gradeDetail: GradeDetail | null;
  /** 绩点成绩 */
  gradePoint: number;
  /** 成绩标志 */
  mark: string;
  /** 课程类型 */
  courseType: string;
  /** 选修课类型 */
  commonType: string;
  /** 课程类型短称 */
  shortCourseType: string;
  /** 学时 */
  hours: number | null;
  /** 学分 */
  point: number;
  /** 考试性质 */
  examType: string;
  /** 补重学期 */
  reLearn: string;
  /** 审核状态 */
  status: string;
}

const getScoreDetail = (content: string): ScoreDetail | null => {
  if (!content.match(/[\d.]+\/\d+%/) || content === "0/0%") return null;

  const [score, percent] = content.split("/");

  return {
    score: Number(score),
    percent: Number(percent.replace("%", "")),
  };
};

const getUnderGrades = (
  content: string,
  isJS = false,
): Promise<UnderGradeOldResult[]> =>
  Promise.all(
    Array.from(
      content.matchAll(isJS ? jsGradeItemRegExp : gradeItemRegExp),
    ).map(async ([, item]) => {
      const [
        ,
        time,
        cid,
        name,
        difficulty,
        grade,
        gradePoint,
        mark = "",
        courseType,
        commonType,
        shortCourseType,
        hours,
        point,
        examType,
        reLearn,
        status,
      ] = Array.from(gradeCellRegExp.exec(item)!).map((item) =>
        item.replace(/&nbsp;/g, " ").trim(),
      );
      const [, gradeLink, gradeText] = gradeRegExp.exec(grade) || [];
      const actualDifficulty = Number(difficulty) || 1;

      const actualGrade =
        gradeText && !Number.isNaN(Number(gradeText))
          ? Number(gradeText)
          : Math.round(
              (Number(gradePoint) / Number(point) / actualDifficulty) * 10 + 50,
            );

      let gradeDetail: GradeDetail | null = null;

      if (gradeLink) {
        const gradeUrl = `${UNDER_SYSTEM_SERVER}${gradeLink}&tktime=${getIETimeStamp()}`;

        try {
          const { data: content } = await request<string>(gradeUrl);
          const matched = gradeDetailRegExp.exec(content);

          if (matched) {
            const [
              ,
              grade1,
              grade2,
              grade3,
              grade4,
              grade5,
              grade6,
              examGrade,
            ] = matched;
            const usualGrades = [grade1, grade2, grade3, grade4, grade5, grade6]
              .map((item) => getScoreDetail(item))
              .filter((item): item is ScoreDetail => !!item);
            const exam = getScoreDetail(examGrade);

            if (exam || usualGrades.length)
              gradeDetail = {
                usual: usualGrades,
                exam,
              };
          }
        } catch (err) {
          // do nothing
        }
      }

      return {
        time: time.substring(2, time.length - 3),
        cid,
        name,
        difficulty: Number(difficulty) || 1,
        grade: actualGrade,
        gradeText:
          gradeText && Number.isNaN(Number(gradeText)) ? gradeText : null,
        gradeDetail,
        gradePoint: actualGrade < 60 ? 0 : Number(gradePoint),
        mark,
        courseType,
        commonType,
        shortCourseType,
        hours: hours ? Number(hours) : null,
        point: Number(point),
        examType,
        reLearn: reLearn ? getDisplayTime(reLearn) : "",
        status,
      };
    }),
  );

export const getUnderOldGradeLists = async (
  content: string,
): Promise<UnderGradeOldResult[]> => {
  // We force writing these 2 field to ensure we care getting the default table structure
  const tableFields = tableFieldsRegExp.exec(content)![1];
  const otherFields = String(otherFieldsRegExp.exec(content)?.[1]);
  const totalPages = Number(totalPagesRegExp.exec(content)![1]);

  // users are editing them, so the main page must be refetched
  const shouldRefetch =
    tableFields !== DEFAULT_TABLE_FIELD || otherFields !== DEFAULT_OTHER_FIELD;

  const grades = shouldRefetch ? [] : await getUnderGrades(content);

  console.log("Total pages:", totalPages);

  if (totalPages === 1 && !shouldRefetch) return grades;

  const field = String(fieldRegExp.exec(content)?.[1]);
  const isSql = sqlRegExp.exec(content)![1];
  const printPageSize = String(printPageSizeRegExp.exec(content)?.[1]);
  const key = String(keyRegExp.exec(content)?.[1]);
  const keyCode = String(keyCodeRegExp.exec(content)?.[1]);
  const printHQL =
    String(printHQLInputRegExp.exec(content)?.[1]) ||
    String(printHQLJSRegExp.exec(content)?.[1]);
  const sqlString = sqlStringRegExp.exec(content)?.[1];
  const xsId = xsIdRegExp.exec(content)![1];

  const pages: number[] = [];

  for (let page = shouldRefetch ? 1 : 2; page <= totalPages; page++)
    pages.push(page);

  await Promise.all(
    pages.map(async (page) => {
      const { data: responseText } = await request<string>(QUERY_URL, {
        method: "POST",
        body: new URLSearchParams({
          xsId,
          keyCode,
          PageNum: page.toString(),
          printHQL,
          ...(sqlString ? { sqlString } : {}),
          isSql,
          printPageSize,
          key,
          field,
          totalPages: totalPages.toString(),
          tableFields: DEFAULT_TABLE_FIELD,
          otherFields: DEFAULT_OTHER_FIELD,
        }),
      });

      const newGrades = await getUnderGrades(responseText, true);

      grades.push(...newGrades);
    }),
  );

  return grades;
};

export interface UnderOldGradeListOptions {
  /** 查询时间 */
  time?: string;
  /** 课程名称 */
  name?: string;
  /** 课程性质 */
  courseType?: UnderCourseType | "";
  gradeType?: "all" | "best";
}

export interface UnderOldGradeListSuccessResponse {
  success: true;
  data: UnderGradeOldResult[];
}

export type UnderOldGradeListResponse =
  | UnderOldGradeListSuccessResponse
  | (CommonFailedResponse & {
      type?: LoginFailType.Expired;
    });

export const getUnderOldGradeList = async ({
  time = "",
  name = "",
  courseType = "",
  gradeType = "all",
}: UnderOldGradeListOptions): Promise<UnderOldGradeListResponse> => {
  try {
    const { data: content, status } = await request<string>(QUERY_URL, {
      method: "POST",
      body: new URLSearchParams({
        kksj: time,
        kcxz: courseType ? COURSE_TYPES[courseType] || "" : "",
        kcmc: name,
        xsfs: gradeType === "best" ? "zhcj" : gradeType === "all" ? "qbcj" : "",
        ok: "",
      }),
      redirect: "manual",
    });

    if (status === 302 || isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    if (content.includes("评教未完成，不能查询成绩！"))
      return {
        success: false,
        msg: time
          ? "此学期评教未完成，不能查询成绩！"
          : "部分学期评教未完成，不能查阅全部成绩! 请分学期查询。",
      };

    const gradeList = await getUnderOldGradeLists(content);

    return {
      success: true,
      data: gradeList,
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

export const getOnlineUnderOldGradeList = (
  options: UnderOldGradeListOptions,
): Promise<UnderOldGradeListResponse> =>
  request<UnderOldGradeListResponse>("/under-system/grade-list", {
    method: "POST",
    body: options,
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
