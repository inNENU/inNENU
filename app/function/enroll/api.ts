import { logger } from "@mptool/enhance";

import {
  type CommonFailedResponse,
  type Cookie,
} from "../../../typings/index.js";
import { service } from "../../config/info.js";

export interface AdmissionSuccessResponse {
  status: "success";
  info: { text: string; value: string }[];
}

export type AdmissionResponse = AdmissionSuccessResponse | CommonFailedResponse;

export interface PostAdmissionPostOptions {
  name: string;
  id: string;
}

export const postAdmission = (
  data: PostAdmissionPostOptions,
): Promise<AdmissionResponse> =>
  new Promise((resolve, reject) => {
    wx.request<AdmissionResponse>({
      method: "POST",
      url: `${service}enroll/post-admission`,
      enableHttp2: true,
      data,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(data);
        } else {
          logger.error("获取研究生录取信息失败", statusCode);
          reject();
        }
      },
      fail: () => reject(),
    });
  });

// export const postAdmission = (
//   data: PostAdmissionPostOptions
// ): Promise<AdmissionResponse> =>
//   fetch<AdmissionResponse>(`${service}enroll/post-admission`, {
//     method: "POST",
//     data,
//   });

export interface UnderAdmissionPostOptions {
  captcha: string;
  name: string;
  id: string;
  testId: string;
  cookies: Cookie[];
}

export interface GetUnderAdmissionResponse {
  cookies: Cookie[];
  info: string[];
  captcha: string;
  notice: string;
  detail: { title: string; content: string };
}

export const underAdmission = <T>(
  method: "GET" | "POST",
  data: Record<string, unknown> = {},
): Promise<T> =>
  new Promise((resolve, reject) => {
    wx.request({
      method,
      url: `${service}enroll/under-admission`,
      enableHttp2: true,
      ...(data ? { data } : {}),
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          resolve(<T>data);
        } else {
          logger.error("获取本科录取信息失败", statusCode);
          reject();
        }
      },
      fail: () => reject(),
    });
  });

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

export type EnrollGradeResponse =
  | EnrollGradeSuccessResponse
  | CommonFailedResponse;

export const getHistoryGrade = (
  options: EnrollPlanOptions,
): Promise<EnrollGradeResponse> =>
  new Promise((resolve, reject) => {
    wx.request<EnrollGradeResponse>({
      method: "POST",
      url: `${service}enroll/grade`,
      data: options,
      enableHttp2: true,
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

export type EnrollPlanResponse =
  | EnrollPlanSuccessResponse
  | CommonFailedResponse;

export const getEnrollPlan = (
  options: EnrollPlanOptions,
): Promise<EnrollPlanResponse> =>
  new Promise((resolve, reject) => {
    wx.request<EnrollPlanResponse>({
      method: "POST",
      url: `${service}enroll/plan`,
      data: options,
      enableHttp2: true,
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
