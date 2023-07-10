import { $Page } from "@mptool/enhance";

import { appCoverPrefix } from "../../config/info.js";

const PAGE_ID = "library";
const PAGE_TITLE = "图书馆";

$Page(PAGE_ID, {
  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: `/function/phone/phone`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),
});
