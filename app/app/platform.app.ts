import { loadFZSSJW } from "../api/index.js";
import type { GlobalData } from "./globalData.js";

export const platformActions = (_globalData: GlobalData): void => {
  loadFZSSJW(true);

  wx.miniapp.registOpenURL(({ action, data }) => {
    if (action === "scheme") {
      wx.reLaunch({
        url: data.path.replace(/^\/?/, "/"),
        query: data.query,
      });
    }
  });
};
