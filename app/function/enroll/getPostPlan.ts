import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

export interface PostEnrollPlanInfo {
  major: string;
  code: string;
  type: string;
}

export interface PostEnrollSchoolPlan {
  name: string;
  code: string;
  site: string;
  contact: string;
  phone: string;
  mail: string;
  majors: PostEnrollPlanInfo[];
}

export interface PostEnrollSuccessResponse {
  success: true;
  data: PostEnrollSchoolPlan[];
}

export type PostEnrollResponse =
  | PostEnrollSuccessResponse
  | CommonFailedResponse;

export const getPostPlan = (): Promise<PostEnrollResponse> =>
  request<PostEnrollResponse>(`${service}enroll/post-plan`, { method: "POST" });
