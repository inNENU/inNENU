import { logger } from "@mptool/enhance";

import { service } from "../../utils/config.js";

export interface EnrollPlanOptions {
  year: string;
  province: string;
  planType: string;
  majorType: string;
  reformType: string;
}

export interface EnrollPlainInfo {
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

export interface EnrollSuccessResponse {
  status: "success";
  data: EnrollPlainInfo[];
}

export interface EnrollFailedResponse {
  status: "failed";
  msg: string;
}

export type EnrollResponse = EnrollSuccessResponse | EnrollFailedResponse;

export const getEnrollPlan = (
  options: EnrollPlanOptions
): Promise<EnrollResponse> =>
  new Promise((resolve, reject) => {
    wx.request<EnrollResponse>({
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
