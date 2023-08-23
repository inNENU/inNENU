import type { SearchIndex } from "../../typings/index.js";
import { request } from "../api/index.js";
import { server } from "../config/index.js";

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
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  wx.reportEvent?.("search", { search_word: data.word });

  return request<T>(`${server}service/search.php`, {
    method: "POST",
    data,
  });
};
