/* eslint-disable @typescript-eslint/naming-convention */
import {
  UNDER_ENROLL_MAJOR_CLASS_URL,
  UNDER_ENROLL_MAJOR_TYPE_URL,
  UNDER_ENROLL_PLAN_URL,
  UNDER_ENROLL_SERVER,
} from "./utils.js";
import { request } from "../../api/index.js";
import { createService } from "../utils.js";

export interface UnderEnrollInfoOptions {
  type: "info";
}

export interface UnderEnrollInfo {
  years: string[];
  provinces: string[];
}

const UNDER_ENROLL_PAGE_URL = `${UNDER_ENROLL_SERVER}/col_000018_000171.html`;

const YEAR_REG_EXP =
  /<select class="custom-select year" id="inputGroupSelect01">\s*?<option selected>请选择<\/option>\s*((?:<option value=".*">.*<\/option>\s*?)+)<\/select>/;
const PROVINCE_REG_EXP =
  /<select class="custom-select province" id="inputGroupSelect01"[^>]*>\s*?<option selected>请选择<\/option>\s*((?:<option value=".*">.*<\/option>\s*?)+)<\/select>/;

const OPTION_REG_EXP = /<option value="(.*?)">.*?<\/option>/g;

const getUnderEnrollInfo = async (): Promise<UnderEnrollInfo> => {
  const { data: content } = await request<string>(UNDER_ENROLL_PAGE_URL);

  const yearOptions = YEAR_REG_EXP.exec(content)?.[1];
  const provinceOptions = PROVINCE_REG_EXP.exec(content)?.[1];

  if (!yearOptions || !provinceOptions) {
    throw new Error("获取省份和年份信息失败");
  }

  const years = Array.from(yearOptions.matchAll(OPTION_REG_EXP)).map(
    ([, value]) => value,
  );
  const provinces = Array.from(provinceOptions.matchAll(OPTION_REG_EXP)).map(
    ([, value]) => value,
  );

  return {
    years,
    provinces,
  };
};

export interface UnderEnrollPlanTypeOptions {
  type: "planType";
  province: string;
  year: string;
}

const getUnderEnrollPlanType = async ({
  year,
  province,
}: UnderEnrollPlanTypeOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_PLAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: { typename: "plan", year, province },
    })
  ).data;

export interface UnderEnrollMajorTypeOptions {
  type: "majorType";
  province: string;
  year: string;
  plan: string;
}

const getUnderEnrollMajorType = async ({
  year,
  province,
  plan,
}: UnderEnrollMajorTypeOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_MAJOR_TYPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ typename: "plan", year, province, plan }),
    })
  ).data;

export interface UnderEnrollMajorClassOptions {
  type: "majorClass";
  province: string;
  year: string;
  plan: string;
  majorType: string;
}

const getUnderEnrollMajorClass = async ({
  year,
  province,
  plan,
  majorType,
}: UnderEnrollMajorClassOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_MAJOR_CLASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typename: "plan",
        year,
        province,
        plan,
        major_type: majorType,
      }),
    })
  ).data;

export interface UnderEnrollPlanQueryOptions {
  type: "query";
  majorClass: string;
  majorType: string;
  plan: string;
  province: string;
  year: string;
}

export interface RawUnderEnrollPlanConfig {
  major: string;
  major_attr: string;
  admission_num: string;
  admission_len: string;
  admission_cost: string;
}

export interface UnderEnrollPlanConfig {
  /** 专业 */
  major: string;
  /** 专业类别 */
  majorType: string;
  /** 招生计划 */
  count: string;
  /** 学制 */
  years: string;
  /** 学费 */
  fee: string;
}

const getUnderEnrollPlans = async (
  options: UnderEnrollPlanQueryOptions,
): Promise<UnderEnrollPlanConfig[]> => {
  const { data: rawPlans } = await request<RawUnderEnrollPlanConfig[]>(
    `${UNDER_ENROLL_SERVER}/queryPlan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    },
  );

  return rawPlans.map(
    ({ major, major_attr, admission_num, admission_len, admission_cost }) => ({
      major,
      majorType: major_attr,
      count: admission_num,
      years: admission_len,
      fee: admission_cost,
    }),
  );
};

export interface UnderEnrollInfoSuccessResponse {
  success: true;
  data: UnderEnrollInfo;
}

export interface UnderEnrollDetailsSuccessResponse {
  success: true;
  data: string[];
}

export interface UnderEnrollPlanSuccessResponse {
  success: true;
  data: UnderEnrollPlanConfig[];
}

export type UnderEnrollPlanOptions =
  | UnderEnrollInfoOptions
  | UnderEnrollPlanTypeOptions
  | UnderEnrollMajorClassOptions
  | UnderEnrollMajorTypeOptions
  | UnderEnrollPlanQueryOptions;

export type UnderEnrollPlanResponse =
  | UnderEnrollInfoSuccessResponse
  | UnderEnrollDetailsSuccessResponse
  | UnderEnrollPlanSuccessResponse;

const getUnderEnrollPlanLocal = async <T extends UnderEnrollPlanOptions>(
  options: T,
): Promise<
  T extends UnderEnrollInfoOptions
    ? UnderEnrollInfo
    : T extends UnderEnrollPlanQueryOptions
      ? UnderEnrollPlanConfig[]
      : string[]
> => {
  const { type } = options;

  return (
    type === "info"
      ? await getUnderEnrollInfo()
      : type === "planType"
        ? await getUnderEnrollPlanType(options)
        : type === "majorType"
          ? await getUnderEnrollMajorType(options)
          : type === "majorClass"
            ? await getUnderEnrollMajorClass(options)
            : await getUnderEnrollPlans(options)
  ) as T extends UnderEnrollInfoOptions
    ? UnderEnrollInfo
    : T extends UnderEnrollPlanQueryOptions
      ? UnderEnrollPlanConfig[]
      : string[];
};

const getUnderEnrollPlanOnline = async <T extends UnderEnrollPlanOptions>(
  options: T,
): Promise<
  T extends UnderEnrollInfoOptions
    ? UnderEnrollInfo
    : T extends UnderEnrollPlanQueryOptions
      ? UnderEnrollPlanConfig[]
      : string[]
> =>
  request<
    T extends UnderEnrollInfoOptions
      ? UnderEnrollInfo
      : T extends UnderEnrollPlanQueryOptions
        ? UnderEnrollPlanConfig[]
        : string[]
  >("/enroll/under-plan", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getUnderEnrollPlan = createService(
  "under-enroll-plan",
  getUnderEnrollPlanLocal,
  getUnderEnrollPlanOnline,
);
