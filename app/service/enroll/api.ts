import { request } from "../../api/index.js";
import type {
  EnrollGradeResponse,
  EnrollPlanOptions,
  EnrollPlanResponse,
} from "../../function/enroll/typings.js";

export const getHistoryGrade = (
  options: EnrollPlanOptions,
): Promise<EnrollGradeResponse> =>
  request<EnrollGradeResponse>("/enroll/grade", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getEnrollPlan = (
  options: EnrollPlanOptions,
): Promise<EnrollPlanResponse> =>
  request<EnrollPlanResponse>("/enroll/plan", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
