import { request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";

export interface GradAdmissionOptions {
  name: string;
  id: string;
}

export interface GradAdmissionSuccessResponse {
  success: true;
  info: { text: string; value: string }[];
}

export type GradAdmissionResponse =
  | GradAdmissionSuccessResponse
  | CommonFailedResponse;

export const getGradAdmission = (
  options: GradAdmissionOptions,
): Promise<GradAdmissionResponse> =>
  request<GradAdmissionResponse>("/enroll/grad-admission", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
