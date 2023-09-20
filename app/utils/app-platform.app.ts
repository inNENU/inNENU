import type { GlobalData } from "./typings.js";
import { loadFZSSJW } from "../api/font.js";

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
