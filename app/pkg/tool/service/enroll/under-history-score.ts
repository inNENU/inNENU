/* eslint-disable @typescript-eslint/naming-convention */
import { logger } from "@mptool/all";

import { UNDER_ENROLL_INFO_URL, UNDER_ENROLL_SERVER } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  MissingArgResponse,
  UnknownResponse,
  createService,
} from "../../../../service/index.js";

export interface UnderHistoryScoreInfoOptions {
  type: "info";
}

export interface UnderHistoryScoreQueryOptions {
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

export type UnderHistoryScoreOptions =
  | UnderHistoryScoreInfoOptions
  | UnderHistoryScoreQueryOptions;

interface RawUnderHistoryScoreOptionConfig {
  major_type: string;
  type: string;
  year: string;
}

type RawUnderHistoryScoreOptionInfo = Record<
  /* province */ string,
  RawUnderHistoryScoreOptionConfig[]
>;

export type UnderHistoryScoreOptionInfo = Record<
  /* province */ string,
  Record<
    /* year */ string,
    Record</* type */ string, /* major type */ string[]>
  >
>;

export type UnderHistoryScoreInfoSuccessResponse =
  CommonSuccessResponse<UnderHistoryScoreOptionInfo>;

export type UnderHistoryScoreInfoResponse =
  | UnderHistoryScoreInfoSuccessResponse
  | CommonFailedResponse;

const getUnderHistoryScoreInfo =
  async (): Promise<UnderHistoryScoreInfoResponse> => {
    // NOTE: year=2023 does not take any effect
    const { data } = await request<RawUnderHistoryScoreOptionInfo>(
      `${UNDER_ENROLL_INFO_URL}?which=score`,
    );

    return {
      success: true,
      data: Object.fromEntries(
        Object.entries(data).map(([province, configs]) => {
          const result: Record<string, Record<string, string[]>> = {};

          configs.forEach(({ major_type, type, year }) => {
            const current = ((result[year] ??= {})[type] ??= []);

            if (!current.includes(major_type)) current.push(major_type);
          });

          return [province, result];
        }),
      ),
    };
  };

interface RawUnderHistoryScoreConfig {
  province: string;
  type: string;
  major_type: string;
  /** 专业名称 */
  major: string;
  /** 专业属性 */
  major_attr: string;
  /** 录取控制线 */
  baseline: string;
  /** 最低文化成绩 */
  min_culture_score: string;
  min_major_score: string;
  min_admission_score: string;
  min_rank: string;
  max_culture_score: string;
  max_major_score: string;
  max_admission_score: string;
  max_rank: string;
  /** 平均文化成绩 */
  avg_culture_score: string;
  /** 平均专业成绩 */
  avg_major_score: string;
  /** 平均录取成绩 */
  avg_admission_score: string;

  memo: { String: ""; Valid: false };
}

interface RawUnderHistoryScoreResult {
  message: "Success";
  year: string;
  scores: RawUnderHistoryScoreConfig[];
}

export interface UnderHistoryScoreConfig {
  /** 专业 */
  major: string;
  /** 专业属性 */
  majorAttr: string;
  /** 录取控制线 */
  baseline: number | null;
  /** 最低录取成绩 */
  minScore: number | null;
  /** 最高录取成绩 */
  maxScore: number | null;
  /** 录取平均成绩 */
  averageScore: number | null;
}

export type UnderHistoryScoreQuerySuccessResponse = CommonSuccessResponse<
  UnderHistoryScoreConfig[]
>;

export type UnderHistoryScoreQueryResponse =
  | UnderHistoryScoreQuerySuccessResponse
  | CommonFailedResponse<ActionFailType.MissingArg | ActionFailType.Unknown>;

const UNDER_HISTORY_SCORE_URL = `${UNDER_ENROLL_SERVER}/api/user/queryScore`;

export const queryUnderHistoryScore = async ({
  province,
  year,
  classType,
  majorType,
}: UnderHistoryScoreQueryOptions): Promise<UnderHistoryScoreQueryResponse> => {
  if (!province) return MissingArgResponse("province");

  if (!year) return MissingArgResponse("year");

  if (!classType) return MissingArgResponse("classType");

  if (!majorType) return MissingArgResponse("majorType");

  const { data } = await request<RawUnderHistoryScoreResult>(
    UNDER_HISTORY_SCORE_URL,
    {
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
    },
  );

  const getNumber = (text: string): number | null => {
    const result = Number(text);

    return Number.isNaN(result) || result < 0 ? null : result;
  };

  return {
    success: true,
    data: data.scores.map(
      ({
        major,
        major_attr: majorAttr,
        baseline,
        min_admission_score: minScore,
        max_admission_score: maxScore,
        avg_admission_score: averageScore,
      }) => ({
        major,
        majorAttr,
        baseline: getNumber(baseline),
        minScore: getNumber(minScore),
        maxScore: getNumber(maxScore),
        averageScore: getNumber(averageScore),
      }),
    ),
  };
};

export type UnderHistoryScoreResponse<T extends UnderHistoryScoreOptions> =
  T extends UnderHistoryScoreInfoOptions
    ? UnderHistoryScoreInfoResponse
    : UnderHistoryScoreQueryResponse;

const getUnderHistoryScoreLocal = async <T extends UnderHistoryScoreOptions>(
  options: T,
): Promise<UnderHistoryScoreResponse<T>> => {
  try {
    const { type } = options;

    return (
      type === "info"
        ? await getUnderHistoryScoreInfo()
        : await queryUnderHistoryScore(options)
    ) as UnderHistoryScoreResponse<T>;
  } catch (err) {
    const { message } = err as Error;

    logger.error(err);

    return UnknownResponse(message);
  }
};

const getUnderHistoryScoreOnline = async <T extends UnderHistoryScoreOptions>(
  options: T,
): Promise<UnderHistoryScoreResponse<T>> =>
  request<UnderHistoryScoreResponse<T>>("/enroll/under-history-score", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getUnderHistoryScore = createService(
  "under-history-score",
  getUnderHistoryScoreLocal,
  getUnderHistoryScoreOnline,
);
