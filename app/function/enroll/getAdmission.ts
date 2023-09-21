import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

export type AdmissionResponse = AdmissionSuccessResponse | CommonFailedResponse;

export interface PostAdmissionPostOptions {
  name: string;
  id: string;
}

export interface UnderAdmissionPostOptions {
  name: string;
  id: string;
  testId: string;
}

export interface AdmissionSuccessResponse {
  success: true;
  info: { text: string; value: string }[];
}

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
