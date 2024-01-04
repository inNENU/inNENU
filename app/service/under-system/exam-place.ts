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
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

const selectRegExp =
  /<select\s+name="kskzid"\s+id="kskzid"[^>]*><option value="">---请选择---<\/option>([\s\S]*?)<\/select>/;
const optionRegExp = /<option value="([^"]+)">([^<]+)<\/option>/g;

const examRegExp =
  /<tr[^>]*><td[^>]*>.*?<\/td>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g;

const DEFAULT_TABLE_FIELD =
  "学号:0:1:90:xh,姓名:1:1:90:xm,课程名称:2:1:130:course_name,考试时间:3:1:260:kw0403.ksqssj,校区名称:4:1:200:xqmc,教学楼:5:1:300:jxl,考场:6:1:420:kw0404.kcmc";
const DEFAULT_OTHER_FIELD = "null";

const INFO_URL = `${UNDER_SYSTEM_SERVER}/jiaowu/kwgl/kwgl_xsJgfb_soso.jsp`;
const QUERY_URL = `${UNDER_SYSTEM_SERVER}/kwsjglAction.do?method=sosoXsFb`;

export interface ExamPlace {
  /** 课程 */
  course: string;
  /** 时间 */
  time: string;
  /** 校区 */
  campus: string;
  /** 教学楼 */
  building: string;
  /** 考场 */
  classroom: string;
}

const getExamPlaces = (content: string): ExamPlace[] =>
  Array.from(content.matchAll(examRegExp)).map((item) => {
    const [, course, time, campus, building, classroom] = item.map((text) =>
      text.replace(/&nbsp;/g, "").trim(),
    );

    return {
      course,
      time,
      campus,
      building,
      classroom,
    };
  });

export const getExamList = async (value: string): Promise<ExamPlace[]> => {
  const { data: content } = await request<string>(QUERY_URL, {
    method: "POST",
    headers: {
      Referer: INFO_URL,
    },
    body: new URLSearchParams({
      xnxq: "",
      kskzid: value,
    }),
  });

  // We force writing these 2 field to ensure we care getting the default table structure
  const tableFields = tableFieldsRegExp.exec(content)![1];
  const otherFields = String(otherFieldsRegExp.exec(content)?.[1]);
  const totalPages = Number(totalPagesRegExp.exec(content)![1]);

  // users are editing them, so the main page must be refetched
  const shouldRefetch =
    tableFields !== DEFAULT_TABLE_FIELD || otherFields !== DEFAULT_OTHER_FIELD;

  const exams = shouldRefetch ? [] : getExamPlaces(content);

  console.log("Total pages:", totalPages);

  if (totalPages === 1 && !shouldRefetch) return exams;

  const field = String(fieldRegExp.exec(content)?.[1]);
  const printPageSize = String(printPageSizeRegExp.exec(content)?.[1]);
  const keyCode = String(keyCodeRegExp.exec(content)?.[1]);
  const printHQL =
    String(printHQLInputRegExp.exec(content)?.[1]) ||
    String(printHQLJSRegExp.exec(content)?.[1]);
  const sqlString = sqlStringRegExp.exec(content)?.[1];

  const pages: number[] = [];

  for (let page = shouldRefetch ? 1 : 2; page <= totalPages; page++)
    pages.push(page);

  await Promise.all(
    pages.map(async (page) => {
      const params = {
        keyCode,
        PageNum: page.toString(),
        printHQL,
        ...(sqlString ? { sqlString } : {}),
        printPageSize,
        field,
        totalPages: totalPages.toString(),
        tableFields: DEFAULT_TABLE_FIELD,
        otherFields: DEFAULT_OTHER_FIELD,
      };

      const { data: responseText } = await request<string>(INFO_URL, {
        method: "POST",
        headers: {
          Referer: INFO_URL,
        },
        body: new URLSearchParams(params),
      });

      const newExamPlaces = getExamPlaces(responseText);

      exams.push(...newExamPlaces);
    }),
  );

  return exams;
};

export interface UnderExamPlaceSuccessResponse {
  success: true;

  /** 计划 */
  data: {
    name: string;
    exams: ExamPlace[];
  }[];
}

export type UnderExamPlaceFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};
export type UnderExamPlaceResponse =
  | UnderExamPlaceSuccessResponse
  | UnderExamPlaceFailedResponse;

export const getUnderExamPlace = async (): Promise<UnderExamPlaceResponse> => {
  try {
    const { data: content, status } = await request<string>(INFO_URL, {
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

    const select = selectRegExp.exec(content)![1].trim();

    const options = Array.from(select.matchAll(optionRegExp)).map(
      ([, value, name]) => ({ value, name }),
    );

    const data = await Promise.all(
      options.map(async ({ name, value }) => ({
        name,
        exams: await getExamList(value),
      })),
    );

    return {
      success: true,
      data,
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

export const getOnlineUnderExamPlace = (): Promise<UnderExamPlaceResponse> =>
  request<UnderExamPlaceResponse>("/under-system/exam-place", {
    method: "POST",
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
