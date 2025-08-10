import type { PageIndexes } from "innenu-generator/typings.js";

import { getJson } from "../../../utils/index.js";

let pageIndexes: PageIndexes | null = null;

export const loadPageIndexes = async (): Promise<void> => {
  if (!pageIndexes) pageIndexes = await getJson<PageIndexes>("function/search");
};

export const unloadPageIndexes = (): void => {
  pageIndexes = null;
};

export const searchPage = async (query: string): Promise<PageIndexes> => {
  const queries = query.split(" ");

  await loadPageIndexes();

  return pageIndexes!.filter(({ name, tags }) =>
    queries.some(
      (item) => name.includes(item) || tags?.some((tag) => item.includes(tag)),
    ),
  );
};
