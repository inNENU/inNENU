import type { GridComponentItemConfig } from "../../typings/components.js";
import { getIdentity } from "../state/index.js";

export interface EntranceItemOptions extends GridComponentItemConfig {
  path: string;
  under?: string | false;
  grad?: string | false;
  benbu?: string | false;
  jingyue?: string | false;
}

export interface EntranceItemData
  extends Omit<GridComponentItemConfig, "path"> {
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
          `info?id=${
            type === "under" && under
              ? under
              : type === "grad" && grad
                ? grad
                : location === "benbu" && benbu
                  ? benbu
                  : location === "jingyue" && jingyue
                    ? jingyue
                    : path
          }&from=${title}`,
      };
    })
    .filter((item) => item !== null);
};
