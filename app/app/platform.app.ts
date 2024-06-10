import type { GlobalData } from "./globalData.js";
import { loadFZSSJW } from "../api/index.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const platformActions = (_globalData: GlobalData): void => {
  loadFZSSJW(true);

  wx.miniapp.registOpenURL(({ action, data }) => {
    if (action === "scheme")
      wx.reLaunch({
        url: data.path.replace(/^\/?/, "/"),
        query: data.query,
      });
  });
};
