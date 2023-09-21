import type {
  EnrollGradeResponse,
  EnrollPlanOptions,
  EnrollPlanResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

export const getHistoryGrade = (
  options: EnrollPlanOptions,
): Promise<EnrollGradeResponse> =>
  request<EnrollGradeResponse>(`${service}enroll/grade`, {
    method: "POST",
    data: options,
  });

export const getEnrollPlan = (
  options: EnrollPlanOptions,
): Promise<EnrollPlanResponse> =>
  request<EnrollPlanResponse>(`${service}enroll/plan`, {
    method: "POST",
    data: options,
  });
