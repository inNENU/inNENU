import { type GlobalData } from "./app.js";
import { loadFZSSJW } from "./font.js";

export const platformActions = (globalData: GlobalData): void => {
  // do nothing
  globalData;
  loadFZSSJW(true);
};
