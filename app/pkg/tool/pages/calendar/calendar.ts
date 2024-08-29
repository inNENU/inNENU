import { $Page, showModal, showToast } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import {
  ensureJson,
  getJson,
  getPageColor,
  showNotice,
} from "../../../../utils/index.js";
import type { TimeLineItem } from "../../components/timeline/timeline.js";

const PAGE_ID = "calendar";
const PAGE_TITLE = "东师校历";

interface CalendarDetail {
  title: string;
  content: TimeLineItem[];
}

$Page(PAGE_ID, {
  data: {
    theme: info.theme,

    calendar: [] as TimeLineItem[],
    calendarDetail: [] as TimeLineItem[],
    popupConfig: {
      title: "校历详情",
      cancel: false,
    },
  },

  onNavigate() {
    ensureJson("function/calendar/index");
  },

  onLoad() {
    getJson<TimeLineItem[]>("function/calendar/index")
      .then((calendar) => {
        this.setData({
          color: getPageColor(),
          theme: info.theme,
          calendar,
        });
      })
      .catch(() => {
        showModal("获取失败", "校历信息获取失败，请稍后重试。", () => {
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

  /** 显示校历详情 */
  showDetail(event: WechatMiniprogram.TouchEvent<{ path: string }>) {
    const { path } = event.detail;

    if (path)
      getJson<CalendarDetail>(`function/calendar/${path}`)
        .then((data) => {
          this.setData({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "popupConfig.title": data.title,
            calendarDetail: data.content,
            display: true,
          });
        })
        .catch(() => {
          showModal(
            "获取失败",
            "学期详情获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者",
          );
        });
    else showToast("所选内容暂无详情");
  },

  /** 关闭校历详情 */
  close() {
    this.setData({ display: false });
  },
});
