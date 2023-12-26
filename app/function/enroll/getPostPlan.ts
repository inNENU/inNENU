import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { RichTextNode } from "../utils/parser.js";

export interface PostEnrollPlanInfo {
  major: string;
  code: string;
  type?: string;
  content: RichTextNode[];
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

export const getPostPlan = (isRecommend = false): Promise<PostEnrollResponse> =>
  request<PostEnrollResponse>(
    `/enroll/post${isRecommend ? "-recommend" : ""}-plan`,
    { method: "POST" },
  ).then(({ data }) => data);
