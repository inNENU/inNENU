import { request, showModal } from "../../api/index.js";
import type { CommonFailedResponse } from "../utils/index.js";

export type SearchType = "all" | "guide" | "intro" | "function";

/** 搜索结果 */
export interface SearchResult {
  /** 页面标题 */
  title: string;
  /** 页面标识 */
  id?: string;
  path?: string;
  icon?: string;
  /** 搜索内容 */
  index?: unknown[];
}

export interface SearchData {
  /** 搜索范围 */
  scope?: SearchType;
  /** 搜索类型 */
  type?: "word" | "result";
  /** 搜索词 */
  word: string;
}

/**
 * 搜索词
 *
 * @param searchWord 输入的搜索词
 * @param scope 搜索范围
 *
 * @returns 匹配的候选词列表
 */
export const searchMiniApp = <T extends string[] | SearchResult[]>(
  data: SearchData,
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  wx.reportEvent?.("search", { search_word: data.word });

  return request<{ success: true; data: T } | CommonFailedResponse>(
    "/mp/search",
    {
      method: "POST",
      body: data,
    },
  ).then(({ data }) => {
    if (data.success) return data.data;

    showModal("搜索失败", data.msg);

    return [] as unknown as T;
  });
};
