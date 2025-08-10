import { getJson } from "../../../utils/index.js";

export interface FunctionIndexItem {
  text: string;
  icon: string;
  url: string;
  tags?: string[];
}

export type FunctionIndex = FunctionIndexItem[];

let functionIndex: FunctionIndex | null = null;

export const loadFunctionIndex = async (): Promise<void> => {
  if (!functionIndex)
    functionIndex = await getJson<FunctionIndex>("function/search");
};

export const unloadFunctionIndex = (): void => {
  functionIndex = null;
};

export const searchFunction = async (query: string): Promise<FunctionIndex> => {
  const queries = query.split(" ");

  await loadFunctionIndex();

  return functionIndex!.filter(({ text, tags }) =>
    queries.some(
      (item) => text.includes(item) || tags?.some((tag) => item.includes(tag)),
    ),
  );
};
