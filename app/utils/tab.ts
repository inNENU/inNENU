import { id2path } from "./id.js";
import type { GridComponentItemOptions } from "../../typings/index.js";
import { getIdentity } from "../state/index.js";

export type EntranceItemOptions = GridComponentItemOptions & {
  path?: string;
  url?: string;
  under?: string | false;
  grad?: string | false;
  benbu?: string | false;
  jingyue?: string | false;
};

export interface EntranceItemData
  extends Omit<GridComponentItemOptions, "path"> {
  url: string;
}

export interface EntranceOptions {
  icon: string;
  name: string;
  path: string;
  items: EntranceItemOptions[];
}

export interface EntranceData {
  icon: string;
  name: string;
  path: string;
  items: EntranceItemData[];
}

export type EntranceConfig = Record<string, EntranceOptions>;

export const getTabData = (
  items: EntranceItemOptions[],
  title: string,
): EntranceItemData[] => {
  const { location, type } = getIdentity();

  return items
    .map(({ under, grad, benbu, jingyue, path, url, ...rest }) => {
      if (
        (type === "under" && under === false) ||
        (type === "grad" && grad === false) ||
        (location === "benbu" && benbu === false) ||
        (location === "jingyue" && jingyue === false)
      )
        return null;

      return {
        ...rest,
        url:
          url ??
          `info?id=${id2path(
            type === "under" && under
              ? under
              : type === "grad" && grad
                ? grad
                : location === "benbu" && benbu
                  ? benbu
                  : location === "jingyue" && jingyue
                    ? jingyue
                    : path,
          )}&from=${title}`,
      };
    })
    .filter((item) => item !== null);
};
