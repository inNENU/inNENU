import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export interface PostAdmissionPostOptions {
  name: string;
  id: string;
}

export interface PostAdmissionSuccessResponse {
  success: true;
  info: { text: string; value: string }[];
}

export type PostAdmissionResponse =
  | PostAdmissionSuccessResponse
  | CommonFailedResponse;

export const postAdmission = (
  options: PostAdmissionPostOptions,
): Promise<PostAdmissionResponse> =>
  request<PostAdmissionResponse>("/enroll/post-admission", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
