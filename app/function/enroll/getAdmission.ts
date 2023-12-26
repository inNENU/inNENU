import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

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
  options: PostAdmissionPostOptions,
): Promise<AdmissionResponse> =>
  request<AdmissionResponse>("/enroll/post-admission", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const underAdmission = <
  T extends string | Record<never, never> | unknown[],
>(
  options: UnderAdmissionPostOptions,
): Promise<T> =>
  request<T>("/enroll/under-admission", {
    method: "POST",
    ...(options ? { body: options } : {}),
  }).then(({ data }) => data);
