import { loadFZSSJW } from "../api/index.js";
import type { GlobalData } from "./globalData.js";

export const platformActions = (_globalData: GlobalData): void => {
  loadFZSSJW(true);
};
