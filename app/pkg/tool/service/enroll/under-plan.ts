import { logger } from "@mptool/all";

import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import { missingArgResponse, unknownResponse, createService } from "../../../../service/index.js";
import { UNDER_ENROLL_INFO_URL, UNDER_ENROLL_SERVER } from "./utils.js";

export interface UnderEnrollPlanInfoOptions {
  type: "info";
}

export interface UnderEnrollPlanQueryOptions {
  type: "query";
  /** 省份 */
  province: string;
  /** 年份 */
  year: string;
  /**类型 */
  classType: string;
  /** 专业类型 */
  majorType: string;
}

export type UnderEnrollPlanOptions = UnderEnrollPlanInfoOptions | UnderEnrollPlanQueryOptions;

interface RawUnderEnrollPlanOptionConfig {
  major_type: string;
  type: string;
  year: string;
}

type RawUnderEnrollPlanOptionInfo = Record</* province */ string, RawUnderEnrollPlanOptionConfig[]>;

export type UnderEnrollPlanOptionInfo = Record<
  /* province */ string,
  Record</* year */ string, Record</* type */ string, /* major type */ string[]>>
>;

export type UnderEnrollPlanInfoSuccessResponse = CommonSuccessResponse<UnderEnrollPlanOptionInfo>;

export type UnderEnrollPlanInfoResponse = UnderEnrollPlanInfoSuccessResponse | CommonFailedResponse;

const getUnderEnrollInfo = async (): Promise<UnderEnrollPlanInfoSuccessResponse> => {
  // NOTE: year=2024 does not take any effect
  // oxlint-disable-next-line typescript/no-unnecessary-type-arguments
  const { data } = await request<RawUnderEnrollPlanOptionInfo>(
    `${UNDER_ENROLL_INFO_URL}?which=plan`,
  );

  return {
    success: true,
    data: Object.fromEntries(
      Object.entries(data).map(([province, configs]) => {
        const result: Record<string, Record<string, string[]>> = {};

        configs.forEach(({ major_type, type, year }) => {
          ((result[year] ??= {})[type] ??= []).push(major_type);
        });

        return [province, result];
      }),
    ),
  };
};

interface RawUnderEnrollPlanConfig {
  edu_cost: string;
  edu_len: string;
  major: string;
  major_attr: string;
  major_type: string;
  number: string;
  province: string;
  type: string;
  memo: { String: ""; Valid: false };
}

interface RawUnderEnrollPlanResult {
  message: "Success";
  year: string;
  plans: RawUnderEnrollPlanConfig[];
}

export interface UnderEnrollPlanConfig {
  /** 专业 */
  major: string;
  /** 专业属性 */
  majorAttr: string;
  /** 招生计划 */
  count: string;
  /** 学制 */
  years: string;
  /** 学费 */
  fee: string;
}

type UnderEnrollPlanQuerySuccessResponse = CommonSuccessResponse<UnderEnrollPlanConfig[]>;

type UnderEnrollPlanQueryResponse =
  | UnderEnrollPlanQuerySuccessResponse
  | CommonFailedResponse<ActionFailType.MissingArg | ActionFailType.Unknown>;

const UNDER_ENROLL_PLAN_URL = `${UNDER_ENROLL_SERVER}/api/user/queryPlan`;

const queryUnderEnrollPlan = async ({
  province,
  year,
  classType,
  majorType,
}: UnderEnrollPlanQueryOptions): Promise<UnderEnrollPlanQueryResponse> => {
  if (!province) return missingArgResponse("province");

  if (!year) return missingArgResponse("year");

  if (!classType) return missingArgResponse("classType");

  if (!majorType) return missingArgResponse("majorType");

  const { data } = await request<RawUnderEnrollPlanResult>(UNDER_ENROLL_PLAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      province,
      year,
      major_type: classType,
      type: majorType,
    }),
  });

  return {
    success: true,
    data: data.plans.map(
      ({ major, major_attr: majorAttr, number, edu_len: years, edu_cost: fee }) => ({
        major,
        majorAttr,
        count: number,
        years,
        fee,
      }),
    ),
  };
};

export type UnderEnrollPlanResponse<T extends UnderEnrollPlanOptions> =
  T extends UnderEnrollPlanInfoOptions ? UnderEnrollPlanInfoResponse : UnderEnrollPlanQueryResponse;

const getUnderEnrollPlanLocal = async <T extends UnderEnrollPlanOptions>(
  options: T,
): Promise<UnderEnrollPlanResponse<T>> => {
  try {
    const { type } = options;

    return (
      type === "info" ? await getUnderEnrollInfo() : await queryUnderEnrollPlan(options)
    ) as UnderEnrollPlanResponse<T>;
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return unknownResponse(message);
  }
};

const getUnderEnrollPlanOnline = async <T extends UnderEnrollPlanOptions>(
  options: T,
): Promise<UnderEnrollPlanResponse<T>> =>
  request<UnderEnrollPlanResponse<T>>("/enroll/under-plan", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getUnderEnrollPlan = createService(
  "under-enroll-plan",
  getUnderEnrollPlanLocal,
  getUnderEnrollPlanOnline,
);
