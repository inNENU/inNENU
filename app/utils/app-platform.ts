import type { GlobalData } from "./app.js";
import { loadFZSSJW } from "../api/font.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const platformActions = (_globalData: GlobalData): void => {
  loadFZSSJW(true);
};
