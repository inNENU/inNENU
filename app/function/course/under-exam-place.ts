import { logger, query } from "@mptool/all";

import type { ExamPlace, UnderExamPlaceResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../login/index.js";
import { cookieStore } from "../../utils/cookie.js";

const selectRegExp =
  /<select\s+name="kskzid"\s+id="kskzid"[^>]*><option value="">---请选择---<\/option>([\s\S]*?)<\/select>/;
const optionRegExp = /<option value="([^"]+)">([^<]+)<\/option>/g;

const keyCodeRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"keyCode"\s+id\s*=\s*"keyCode"\s+value="([^"]*?)">/;
const printHQLInputRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"printHQL"\s+id\s*=\s*"printHQL"\s+value="([^"]*?)">/;
const printHQLJSRegExp =
  /window\.parent\.document\.getElementById\('printHQL'\)\.value = '([^']*?)';/;
const printPageSizeRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"printPageSize"\s+id\s*=\s*"printPageSize"\s+value="([^"]*?)">/;
const sqlStringRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"sqlString"\s+id\s*=\s*"sqlString"\s+value="([^"]*?)">/;
const fieldRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"field"\s+id\s*=\s*"field"\s+value="([^"]*?)">/;
const totalPagesRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"totalPages"\s+id\s*=\s*"totalPages"\s+value="([^"]*?)">/;
const tableFieldsRegExp =
  /<input type="hidden"\s+name\s*=\s*"tableFields"\s+id\s*=\s*"tableFields"\s+value="([^"]+?)">/;
const otherFieldsRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"otherFields"\s+id\s*=\s*"otherFields"\s+value="([^"]*?)">/;
const examRegExp =
  /<tr[^>]*><td[^>]*>.*?<\/td>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g;

const DEFAULT_TABLE_FIELD =
  "学号:0:1:90:xh,姓名:1:1:90:xm,课程名称:2:1:130:course_name,考试时间:3:1:260:kw0403.ksqssj,校区名称:4:1:200:xqmc,教学楼:5:1:300:jxl,考场:6:1:420:kw0404.kcmc";
const DEFAULT_OTHER_FIELD = "null";

const INFO_URL = `${UNDER_SYSTEM_SERVER}/jiaowu/kwgl/kwgl_xsJgfb_soso.jsp`;
const QUERY_URL = `${UNDER_SYSTEM_SERVER}/kwsjglAction.do?method=sosoXsFb`;

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
  const content = await request<string>(QUERY_URL, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: query.stringify({
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
      const params = query.stringify({
        keyCode,
        PageNum: page.toString(),
        printHQL,
        ...(sqlString ? { sqlString } : {}),
        printPageSize,
        field,
        totalPages: totalPages.toString(),
        tableFields: DEFAULT_TABLE_FIELD,
        otherFields: DEFAULT_OTHER_FIELD,
      });

      const responseText = await request<string>(INFO_URL, {
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: INFO_URL,
        },
        data: params,
      });

      const newExamPlaces = getExamPlaces(responseText);

      exams.push(...newExamPlaces);
    }),
  );

  return exams;
};

export const getUnderExamPlace = async (): Promise<UnderExamPlaceResponse> => {
  try {
    const content = await request<string>(INFO_URL);

    if (isWebVPNPage(content)) {
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
  request<UnderExamPlaceResponse>(`${service}under-system/exam-place`, {
    method: "POST",
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
