import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

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

export const getEnrollPlan = (
  options: EnrollPlanOptions,
): Promise<EnrollPlanResponse> =>
  request<EnrollPlanResponse>("/enroll/plan", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
