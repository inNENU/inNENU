import type {
  AdmissionResponse,
  EnrollGradeResponse,
  EnrollPlanOptions,
  EnrollPlanResponse,
  PostAdmissionPostOptions,
  UnderAdmissionPostOptions,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/index.js";

export const postAdmission = (
  data: PostAdmissionPostOptions,
): Promise<AdmissionResponse> =>
  request<AdmissionResponse>(`${service}enroll/post-admission`, {
    method: "POST",
    data,
  });

export const underAdmission = <
  T extends string | Record<never, never> | unknown[],
>(
  data: UnderAdmissionPostOptions,
): Promise<T> =>
  request<T>(`${service}enroll/under-admission`, {
    method: "POST",
    ...(data ? { data } : {}),
  });

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
