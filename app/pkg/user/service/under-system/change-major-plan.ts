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
import { cookieStore, request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import {
  LoginFailType,
  createService,
  getIETimeStamp,
  isWebVPNPage,
} from "../../../../service/index.js";

const headerRegExp = /<title>(.*)<\/title>/;
const planRegExp =
  /<tr[^>]*><td[^>]*>.*?<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g;

const DEFAULT_TABLE_FIELD =
  "控制名称:12:1:100:e.kzmc,学院:11:1:150:c.dwmc,专业名称:10:1:150:zymc,接收科类:16:1:80:zykl,考核方式:3:1:70:zzykhfs.dmmc,考核时间:4:1:110:khsj,考核地点:5:1:80:khdd,拟转入人数:6:1:90:zrrs,报名人数:17:1:90:jyzrrs,转入条件:15:1:60:zrtj,联系人:18:1:90:lxr,咨询电话:19:1:100:lxdh";
const DEFAULT_OTHER_FIELD = "null";

const QUERY_URL = `${UNDER_SYSTEM_SERVER}/jiaowu/xjgl/zzygl/zzyxxgl_xsd_list.jsp`;

export interface ChangeMajorPlan {
  /** 学院 */
  school: string;
  /** 专业 */
  major: string;
  /** 科类 */
  subject: string;
  /** 考试类型 */
  examType: string;
  /** 考试时间 */
  time: string;
  /** 考试地点 */
  location: string;
  /** 计划数 */
  plan: number;
  /** 当前报名人数 */
  current: number;
  /** 准入要求 */
  requirement: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
}

const getPlans = (content: string): ChangeMajorPlan[] =>
  Array.from(content.matchAll(planRegExp)).map(
    ([
      ,
      ,
      school,
      major,
      subject,
      examType,
      time,
      location,
      plan,
      current,
      requirement,
      contact,
      phone,
    ]) => ({
      school,
      major,
      subject,
      examType,
      time,
      location,
      plan: Number(plan),
      current: Number(current),
      requirement: requirement
        .replace(/准入考核内容/g, "\n准入考核内容")
        .replace(/(\d+)\./g, "\n$1.")
        .replace(/([一二三四五六七八九十]+)、/g, "\n$1、")
        .trim(),
      contact,
      phone,
    }),
  );

const getPlanList = async (content: string): Promise<ChangeMajorPlan[]> => {
  // We force writing these 2 field to ensure we care getting the default table structure
  const tableFields = tableFieldsRegExp.exec(content)![1];
  const otherFields = String(otherFieldsRegExp.exec(content)?.[1]);
  const totalPages = Number(totalPagesRegExp.exec(content)![1]);

  // users are editing them, so the main page must be refetched
  const shouldRefetch =
    tableFields !== DEFAULT_TABLE_FIELD || otherFields !== DEFAULT_OTHER_FIELD;

  const plans = shouldRefetch ? [] : getPlans(content);

  console.log("Total pages:", totalPages);

  if (totalPages === 1 && !shouldRefetch) return plans;

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
      const { data: responseText } = await request<string>(QUERY_URL, {
        method: "POST",
        body: new URLSearchParams({
          keyCode,
          PageNum: page.toString(),
          printHQL,
          ...(sqlString ? { sqlString } : {}),
          printPageSize,
          field,
          totalPages: totalPages.toString(),
          tableFields: DEFAULT_TABLE_FIELD,
          otherFields: DEFAULT_OTHER_FIELD,
        }),
      });

      const newPlans = getPlans(responseText);

      plans.push(...newPlans);
    }),
  );

  return plans;
};

export interface UnderChangeMajorPlanSuccessResponse {
  success: true;
  /** 计划标题 */
  header: string;
  /** 计划 */
  plans: ChangeMajorPlan[];
}

export type UnderChangeMajorPlanFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type UnderChangeMajorPlanResponse =
  | UnderChangeMajorPlanSuccessResponse
  | UnderChangeMajorPlanFailedResponse;

const getUnderChangeMajorPlansLocal =
  async (): Promise<UnderChangeMajorPlanResponse> => {
    try {
      const { data: content } = await request<string>(
        `${QUERY_URL}?tktime=${getIETimeStamp()}`,
      );

      if (isWebVPNPage(content)) {
        cookieStore.clear();

        return {
          success: false,
          type: LoginFailType.Expired,
          msg: "登录已过期，请重新登录",
        };
      }

      const header = headerRegExp.exec(content)![1].trim();

      const plans = await getPlanList(content);

      return {
        success: true,
        header,
        plans,
      } as UnderChangeMajorPlanSuccessResponse;
    } catch (err) {
      const { message } = err as Error;

      console.error(err);

      return {
        success: false,
        msg: message,
      };
    }
  };

const getUnderChangeMajorPlansOnline =
  (): Promise<UnderChangeMajorPlanResponse> =>
    request<UnderChangeMajorPlanResponse>("/under-system/change-major", {
      method: "POST",
      cookieScope: UNDER_SYSTEM_SERVER,
    }).then(({ data }) => {
      if (!data.success) logger.error("获取转专业计划失败", data.msg);

      return data;
    });

export const getUnderChangeMajorPlans = createService(
  "change-major-plan",
  getUnderChangeMajorPlansLocal,
  getUnderChangeMajorPlansOnline,
);
