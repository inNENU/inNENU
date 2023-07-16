import { $Page } from "@mptool/all";

import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "library";
const PAGE_TITLE = "图书馆";

$Page(PAGE_ID, {
  data: {
    nav: {
      title: "图书馆",
    },
    theme: globalData.theme,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
    });
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: `/function/library/library`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),
});
