import { $Page, showModal } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import {
  ensureJson,
  getJson,
  getPageColor,
  showNotice,
} from "../../../../utils/index.js";
import type { TimeLineItem } from "../../components/timeline/timeline.js";

const PAGE_ID = "calendar-history";
const PAGE_TITLE = "东师校史沿革";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    calendar: [] as TimeLineItem[],
  },

  onNavigate() {
    ensureJson("function/calendar/history");
  },

  onLoad() {
    getJson<TimeLineItem[]>("function/calendar/history")
      .then((calendar) => {
        this.setData({
          color: getPageColor(),
          theme: info.theme,
          calendar,
        });
      })
      .catch(() => {
        showModal("获取失败", "校史信息获取失败，请稍后重试。", () => {
          this.$back();
        });
      });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),
});
