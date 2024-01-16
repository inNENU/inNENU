import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../config/index.js";
import { info } from "../../state/info.js";
import { getColor } from "../../utils/page.js";

const PAGE_ID = "library";
const PAGE_TITLE = "图书馆";

$Page(PAGE_ID, {
  data: {
    nav: {
      title: "图书馆",
    },
    theme: info.theme,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
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
