import type { CommonFailedResponse } from "../../../typings/index.js";

export interface HistoryGradeOptions {
  year: string;
  province: string;
  planType: string;
  majorType: string;
  reformType: string;
}

export type HistoryGradeInfoItem = string[];

export interface HistoryGradeResult {
  titles: string[];
  items: HistoryGradeInfoItem[];
}

export interface EnrollGradeSuccessResponse {
  success: true;
  data: HistoryGradeResult;
}

export type EnrollGradeResponse =
  | EnrollGradeSuccessResponse
  | CommonFailedResponse;

export interface EnrollPlanOptions {
  year: string;
  province: string;
  planType: string;
  majorType: string;
  reformType: string;
}

export interface EnrollPlanInfo {
  /** 专业名称 */
  major: string;
  /** 专业属性 */
  majorType: string;
  /** 科类 */
  planType: string;
  /** 招生人数 */
  count: string;
  /** 学费 */
  year: string;
  /** 学费 */
  fee: string;
  /** 备注 */
  remark: string;
}

export interface EnrollPlanSuccessResponse {
  success: true;
  data: EnrollPlanInfo[];
}

export type EnrollPlanResponse =
  | EnrollPlanSuccessResponse
  | CommonFailedResponse;
