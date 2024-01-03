import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export interface HistoryGradeOptions {
  year: string;
  province: string;
  planType: string;
  majorType: string;
  reformType: string;
}

export type HistoryGradeInfoItem = string[];

export interface HistoryGradeResult {
  titles: string[];
  items: HistoryGradeInfoItem[];
}

export interface EnrollGradeSuccessResponse {
  success: true;
  data: HistoryGradeResult;
}

export type EnrollGradeResponse =
  | EnrollGradeSuccessResponse
  | CommonFailedResponse;

export const getHistoryGrade = (
  options: HistoryGradeOptions,
): Promise<EnrollGradeResponse> =>
  request<EnrollGradeResponse>("/enroll/grade", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
