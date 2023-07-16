import { logger } from "@mptool/all";

import { type SearchIndex } from "../../typings/index.js";
import { netReport, showToast } from "../api/index.js";
import { server } from "../config/info.js";

/** 搜索结果 */
export interface SearchResult {
  /** 页面标题 */
  title: string;
  /** 页面标识 */
  id: string;
  /** 搜索内容 */
  index?: SearchIndex[];
}

export interface SearchData {
  /** 搜索词 */
  word: string;
  /** 搜索范围 */
  scope: "all" | "guide" | "intro";
  /** 搜索类型 */
  type: "word" | "result";
}

/**
 * 搜索词
 *
 * @param searchWord 输入的搜索词
 * @param scope 搜索范围
 *
 * @returns 匹配的候选词列表
 */
export const search = <T extends string[] | SearchResult[]>(
  data: SearchData,
): Promise<T> =>
  new Promise((resolve, reject) => {
    wx.request<T>({
      url: `${server}service/search.php`,
      method: "POST",
      enableHttp2: true,
      data,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          // 调试
          logger.debug(`Request success: `, data);

          resolve(data);
        } else {
          showToast("服务器出现问题，请稍后重试");
          // 调试
          logger.warn(`Request failed with statusCode: ${statusCode}`);

          reject(statusCode);
        }
      },
      fail: ({ errMsg }) => {
        reject(errMsg);
        netReport();

        // 调试
        logger.warn(`Request failed: ${errMsg}`);
      },
    });

    // eslint-disable-next-line @typescript-eslint/naming-convention
    wx.reportEvent?.("search", { search_word: data.word });
  });
