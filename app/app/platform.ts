import { loadFZSSJW } from "../api/index.js";
import type { GlobalData } from "./globalData.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const platformActions = (_globalData: GlobalData): void => {
  loadFZSSJW(true);
};
