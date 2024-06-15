import type { GridComponentItemConfig } from "../../typings/components.js";

export interface TabDataItem {
  icon: string;
  name: string;
  path: string;
  items: (GridComponentItemConfig & {
    under?: string | null;
    grad?: string | null;
    benbu?: string | null;
    jingyue?: string | null;
  })[];
}

export type TabData = Record<string, TabDataItem>;
