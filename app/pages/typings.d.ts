import type { GridComponentItemConfig } from "../../typings/components.js";

export interface TabDataItem {
  icon: string;
  name: string;
  path: string;
  items: GridComponentItemConfig[];
}

export type TabData = Record<string, TabDataItem>;
