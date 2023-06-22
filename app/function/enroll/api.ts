import { logger } from "@mptool/enhance";

import { service } from "../../utils/config.js";

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
  status: "success";
  data: HistoryGradeResult;
}

export interface EnrollGradeFailedResponse {
  status: "failed";
  msg: string;
}

export type EnrollGradeResponse =
  | EnrollGradeSuccessResponse
  | EnrollGradeFailedResponse;

export const getHistoryGrade = (
  options: EnrollPlanOptions
): Promise<EnrollGradeResponse> =>
  new Promise((resolve, reject) => {
    wx.request<EnrollGradeResponse>({
      method: "POST",
      url: `${service}enroll/grade`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("历史分数获取失败", options, data.msg);
        } else reject();
      },
      fail: () => reject(),
    });
  });

export interface EnrollPlanOptions {
  year: string;
  province: string;
  planType: string;
  majorType: string;
  reformType: string;
}

export interface EnrollPlanInfo {
  /** 专业名称 */
  major: string;
  /** 专业属性 */
  majorType: string;
  /** 科类 */
  planType: string;
  /** 招生人数 */
  count: string;
  /** 学费 */
  year: string;
  /** 学费 */
  fee: string;
  /** 备注 */
  remark: string;
}

export interface EnrollPlanSuccessResponse {
  status: "success";
  data: EnrollPlanInfo[];
}

export interface EnrollPlanFailedResponse {
  status: "failed";
  msg: string;
}

export type EnrollPlanResponse =
  | EnrollPlanSuccessResponse
  | EnrollPlanFailedResponse;

export const getEnrollPlan = (
  options: EnrollPlanOptions
): Promise<EnrollPlanResponse> =>
  new Promise((resolve, reject) => {
    wx.request<EnrollPlanResponse>({
      method: "POST",
      url: `${service}enroll/plan`,
      data: options,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
          if (data.status === "failed")
            logger.error("招生计划获取失败", options, data.msg);
        } else reject();
      },
      fail: () => reject(),
    });
  });
