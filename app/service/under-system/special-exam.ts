import { URLSearchParams, logger } from "@mptool/all";

import {
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
import { UNDER_SYSTEM_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/response.js";
import { cookieStore, request } from "../../api/index.js";
import { getIETimeStamp } from "../../utils/browser.js";
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

export interface UnderSpecialExamItem {
  /** 考试时间 */
  time: string;

  /** 考试名称 */
  name: string;

  /** 考试分数 */
  score: number;
}

const gradeItemRegExp =
  /<td[^>]*?>[^<]*?<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>[^<]*?<\/td><td[^>]*?>[^<]*?<\/td><td[^>]*?>[^<]*?<\/td><td[^>]*?>[^<]*?<\/td><td[^>]*?>[^<]*?<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><\/tr>/g;

const sqlRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"isSql"\s+id\s*=\s*"isSql"\s+value="([^"]*?)">/;

const keyRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"key"\s+id\s*=\s*"key"\s+value="([^"]*?)">/;

const xsIdRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"xsId"\s+id\s*=\s*"xsId"\s+value="([^"]*?)" \/>/;

const DEFAULT_TABLE_FIELD =
  "学年学期:0:1:120:xqmc,学号:1:1:120:xh,姓名:2:1:120:xm,管理年度:7:1:120:dqszj,专业名称:5:1:120:zymc,上课单位:6:1:150:dwmc,控制名称:4:1:150:skkz,总成绩:3:1:100:zcj";
const DEFAULT_OTHER_FIELD = "null";
const QUERY_URL = `${UNDER_SYSTEM_SERVER}/jiaowu/cjgl/cxfxtj/zxcjcxxs.jsp`;

const getGrades = (content: string): UnderSpecialExamItem[] =>
  Array.from(content.matchAll(gradeItemRegExp)).map(
    ([, time, name, score]) => ({
      time,
      name,
      score: Number(score),
    }),
  );

export const getSpecialExams = async (
  content: string,
): Promise<UnderSpecialExamItem[]> => {
  // We force writing these 2 field to ensure we care getting the default table structure
  const tableFields = tableFieldsRegExp.exec(content)![1];
  const otherFields = String(otherFieldsRegExp.exec(content)?.[1]);
  const totalPages = Number(totalPagesRegExp.exec(content)![1]);

  // users are editing them, so the main page must be refetched
  const shouldRefetch =
    tableFields !== DEFAULT_TABLE_FIELD || otherFields !== DEFAULT_OTHER_FIELD;

  const grades = shouldRefetch ? [] : getGrades(content);

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

      const newGrades = getGrades(responseText);

      grades.push(...newGrades);
    }),
  );

  return grades;
};

export interface UnderSpecialExamSuccessResponse {
  success: true;
  data: UnderSpecialExamItem[];
}

export type UnderSpecialExamResponse =
  | UnderSpecialExamSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export const getUnderSpecialExamScore =
  async (): Promise<UnderSpecialExamResponse> => {
    try {
      const { data: content, status } = await request<string>(
        `${QUERY_URL}?tktime=${getIETimeStamp()}`,
        {
          redirect: "manual",
        },
      );

      if (status === 302 || isWebVPNPage(content)) {
        cookieStore.clear();

        return {
          success: false,
          type: LoginFailType.Expired,
          msg: "登录已过期，请重新登录",
        };
      }

      const gradeList = await getSpecialExams(content);

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

export const getOnlineUnderSpecialExamScore =
  (): Promise<UnderSpecialExamResponse> =>
    request<UnderSpecialExamResponse>("/under-system/special-exam", {
      method: "POST",
      cookieScope: UNDER_SYSTEM_SERVER,
    }).then(({ data }) => {
      if (!data.success) logger.error("获取失败", data.msg);

      return data;
    });
