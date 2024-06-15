/* eslint-disable @typescript-eslint/naming-convention */
import {
  UNDER_ENROLL_MAJOR_CLASS_URL,
  UNDER_ENROLL_MAJOR_TYPE_URL,
  UNDER_ENROLL_PLAN_URL,
  UNDER_ENROLL_SERVER,
} from "./utils.js";
import { request } from "../../../../api/index.js";
import { createService } from "../../../../service/index.js";

export interface UnderEnrollGradeInfoOptions {
  type: "info";
}

export interface UnderEnrollGradeInfo {
  years: string[];
  provinces: string[];
}

const UNDER_HISTORY_GRADE_PAGE_URL = `${UNDER_ENROLL_SERVER}/col_000018_000170.html`;

const YEAR_REG_EXP =
  /<select class="custom-select year" id="inputGroupSelect01">\s*?<option selected>请选择<\/option>\s*((?:<option value=".*">.*<\/option>\s*?)+)<\/select>/;
const PROVINCE_REG_EXP =
  /<select class="custom-select province" id="inputGroupSelect01"[^>]*>\s*?<option selected>请选择<\/option>\s*((?:<option value=".*">.*<\/option>\s*?)+)<\/select>/;

const OPTION_REG_EXP = /<option value="(.*?)">.*?<\/option>/g;

const getUnderEnrollGradeInfo = async (): Promise<UnderEnrollGradeInfo> => {
  const { data: content } = await request<string>(UNDER_HISTORY_GRADE_PAGE_URL);

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

export interface UnderEnrollGradeTypeOptions {
  type: "planType";
  province: string;
  year: string;
}

const getUnderEnrollGradeType = async ({
  year,
  province,
}: UnderEnrollGradeTypeOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_PLAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: { typename: "score", year, province },
    })
  ).data;

export interface UnderEnrollGradeMajorTypeOptions {
  type: "majorType";
  province: string;
  year: string;
  plan: string;
}

const getUnderEnrollGradeMajorType = async ({
  year,
  province,
  plan,
}: UnderEnrollGradeMajorTypeOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_MAJOR_TYPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ typename: "score", year, province, plan }),
    })
  ).data;

export interface UnderEnrollGradeMajorClassOptions {
  type: "majorClass";
  province: string;
  year: string;
  plan: string;
  majorType: string;
}

const getUnderEnrollGradeMajorClass = async ({
  year,
  province,
  plan,
  majorType,
}: UnderEnrollGradeMajorClassOptions): Promise<string[]> =>
  (
    await request<string[]>(UNDER_ENROLL_MAJOR_CLASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typename: "score",
        year,
        province,
        plan,
        major_type: majorType,
      }),
    })
  ).data;

export interface UnderEnrollGradeQueryOptions {
  type: "query";
  majorClass: string;
  majorType: string;
  plan: string;
  province: string;
  year: string;
}

export interface RawUnderEnrollGradeConfig {
  /** 专业 */
  major: string;
  /** 专业类别 */
  major_class: null;
  /** 专业属性 */
  admission_type: string;
  /** 重点线 */
  baseline: number;
  /** 专业录取线 */
  min_major_achievement: number;
  /** 最低文化成绩 */
  min_cultural_achievement: number;
  /** 最低录取成绩 */
  min_admission_achievement: number;
  /** 最高录取成绩 */
  max_admission_achievement: number;
}

export interface UnderEnrollGradeConfig {
  /** 专业 */
  major: string;
  /** 专业类别 */
  majorType: string;
  /** 重点线 */
  baseline: number;
  /** 专业录取线 */
  minMajorScore: number;
  /** 最低文化成绩 */
  minCulturalScore: number;
  /** 最低录取成绩 */
  minAdmissionScore: number;
  /** 最高录取成绩 */
  maxAdmissionScore: number;
}

const QUERY_URL = `${UNDER_ENROLL_SERVER}/queryScore`;

const getUnderEnrollGrades = async (
  options: UnderEnrollGradeQueryOptions,
): Promise<UnderEnrollGradeConfig[]> => {
  const { data: rawPlans } = await request<RawUnderEnrollGradeConfig[]>(
    QUERY_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    },
  );

  return rawPlans.map(
    ({
      major,
      admission_type,
      baseline,
      min_major_achievement,
      min_cultural_achievement,
      min_admission_achievement,
      max_admission_achievement,
    }) => ({
      major,
      majorType: admission_type,
      baseline,
      minMajorScore: min_major_achievement,
      minCulturalScore: min_cultural_achievement,
      minAdmissionScore: min_admission_achievement,
      maxAdmissionScore: max_admission_achievement,
    }),
  );
};

export interface UnderEnrollGradeInfoSuccessResponse {
  success: true;
  data: UnderEnrollGradeInfo;
}

export interface UnderEnrollGradeDetailsSuccessResponse {
  success: true;
  data: string[];
}

export interface UnderEnrollGradeSuccessResponse {
  success: true;
  data: UnderEnrollGradeConfig[];
}

export type UnderEnrollGradeOptions =
  | UnderEnrollGradeInfoOptions
  | UnderEnrollGradeTypeOptions
  | UnderEnrollGradeMajorClassOptions
  | UnderEnrollGradeMajorTypeOptions
  | UnderEnrollGradeQueryOptions;

export type UnderEnrollGradeResponse =
  | UnderEnrollGradeInfoSuccessResponse
  | UnderEnrollGradeDetailsSuccessResponse
  | UnderEnrollGradeSuccessResponse;

const getUnderEnrollGradeLocal = async <T extends UnderEnrollGradeOptions>(
  options: T,
): Promise<
  T extends UnderEnrollGradeInfoOptions
    ? UnderEnrollGradeInfo
    : T extends UnderEnrollGradeQueryOptions
      ? UnderEnrollGradeConfig[]
      : string[]
> => {
  const { type } = options;

  return (
    type === "info"
      ? await getUnderEnrollGradeInfo()
      : type === "planType"
        ? await getUnderEnrollGradeType(options)
        : type === "majorType"
          ? await getUnderEnrollGradeMajorType(options)
          : type === "majorClass"
            ? await getUnderEnrollGradeMajorClass(options)
            : await getUnderEnrollGrades(options)
  ) as T extends UnderEnrollGradeInfoOptions
    ? UnderEnrollGradeInfo
    : T extends UnderEnrollGradeQueryOptions
      ? UnderEnrollGradeConfig[]
      : string[];
};

const getUnderEnrollGradeOnline = async <T extends UnderEnrollGradeOptions>(
  options: T,
): Promise<
  T extends UnderEnrollGradeInfoOptions
    ? UnderEnrollGradeInfo
    : T extends UnderEnrollGradeQueryOptions
      ? UnderEnrollGradeConfig[]
      : string[]
> =>
  request<
    T extends UnderEnrollGradeInfoOptions
      ? UnderEnrollGradeInfo
      : T extends UnderEnrollGradeQueryOptions
        ? UnderEnrollGradeConfig[]
        : string[]
  >("/enroll/under-grade", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getUnderEnrollGrade = createService(
  "under-history-grade",
  getUnderEnrollGradeLocal,
  getUnderEnrollGradeOnline,
);
