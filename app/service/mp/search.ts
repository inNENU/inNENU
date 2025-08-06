/* eslint-disable @typescript-eslint/naming-convention */

import { request } from "../../api/index.js";

interface RawMeiliSearchHit {
  anchor: string;
  content: string;
  url: string;
  lang: string;
  objectID: string;
  hierarchy_lvl0: string | null;
  hierarchy_lvl1: string | null;
  hierarchy_lvl2: string | null;
  hierarchy_lvl3: string | null;
  hierarchy_lvl4: string | null;
  hierarchy_lvl5: string | null;
  hierarchy_lvl6: string | null;
  hierarchy_radio_lvl0: string | null;
  hierarchy_radio_lvl1: string | null;
  hierarchy_radio_lvl2: string | null;
  hierarchy_radio_lvl3: string | null;
  hierarchy_radio_lvl4: string | null;
  hierarchy_radio_lvl5: string | null;
  _formatted: {
    anchor: string;
    content: string;
    url: string;
    lang: string;
    objectID: string;
    hierarchy_lvl0: string | null;
    hierarchy_lvl1: string | null;
    hierarchy_lvl2: string | null;
    hierarchy_lvl3: string | null;
    hierarchy_lvl4: string | null;
    hierarchy_lvl5: string | null;
    hierarchy_lvl6: string | null;
    hierarchy_radio_lvl0: string | null;
    hierarchy_radio_lvl1: string | null;
    hierarchy_radio_lvl2: string | null;
    hierarchy_radio_lvl3: string | null;
    hierarchy_radio_lvl4: string | null;
    hierarchy_radio_lvl5: string | null;
  };
}

interface RawMeiliSearchResponse {
  hits: RawMeiliSearchHit[];
  offset: number;
  limit: number;
  processingTimeMs: number;
  query: string;
  estimatedTotalHits: number;
}

export interface PageSearchHit {
  id: string;
  title: HighlightInfo[];
  header?: HighlightInfo[];
  content?: HighlightInfo[];
}

export interface PageSearchResult {
  results: PageSearchHit[];
  total: number;
}

/**
 * 定义高亮内容片段的元组类型。
 */
type HighlightInfo = [content: string, isHighlighted: boolean];

const EM_REGEXP = /(<em>.*?<\/em>)/;

/**
 * 将包含 <em> 标签的字符串解析为一个元组数组，专为小程序 setData 优化。
 *
 * @param str - 输入的字符串，可能包含 <em>...</em> 标签。
 * @returns 一个元组数组，格式为 [content: string, isHighlighted: boolean]。
 */
export const getHighlightContent = (str?: string): HighlightInfo[] => {
  if (!str) return [];

  // 使用带捕获组的正则表达式进行分割
  const parts = str.split(EM_REGEXP);

  const result: HighlightInfo[] = [];

  for (const part of parts) {
    // skip empty parts
    if (!part) continue;

    if (part.startsWith("<em>") && part.endsWith("</em>")) {
      // 提取标签内的文本内容
      const content = part.slice(4, -5);

      // 推入元组：[内容, true]
      result.push([content, true]);
    } else {
      // 否则，它就是普通文本
      // 推入元组：[内容, false]
      result.push([part, false]);
    }
  }

  return result;
};

export const meiliSearch = async (query: string): Promise<PageSearchResult> => {
  wx.reportEvent?.("search", { search_word: query });

  const { data } = await request<RawMeiliSearchResponse>(
    "https://meilisearch.innenu.com/indexes/innenu/search",
    {
      method: "POST",
      body: {
        q: query,
        attributesToHighlight: ["*"],
        attributesToCrop: ["content"],
        cropLength: 25,
        filter: ["lang=zh-CN"],
      },
      headers: {
        Authorization: `Bearer 35f2107c9146d9f57fa00454252dce5d40c87c16ee60de6d1ef3f5095c318b50`,
        "Content-Type": "application/json",
      },
    },
  );

  return {
    total: data.estimatedTotalHits,
    results: data.hits.map(({ _formatted }) => ({
      id: _formatted.url
        .substring(19) // length of 'https://innenu.com/'
        .replace(/#.*$/, "") // remove hash
        .replace(/\/index.html$/, "/")
        .replace(/\.html$/, ""),
      title: getHighlightContent(
        _formatted.hierarchy_lvl1 || _formatted.hierarchy_lvl0 || "资料",
      ),
      header: getHighlightContent(
        [
          _formatted.hierarchy_lvl2,
          _formatted.hierarchy_lvl3,
          _formatted.hierarchy_lvl4,
          _formatted.hierarchy_lvl5,
        ]
          .filter(Boolean)
          .join(" > "),
      ),
      content: getHighlightContent(_formatted.content),
    })),
  };
};
