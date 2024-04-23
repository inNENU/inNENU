import { $Page } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { TimeLineItem } from "../../components/timeline/timeline.js";
import { appCoverPrefix } from "../../config/index.js";
import { info } from "../../state/info.js";
import { ensureResource, getResource } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

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
    ensureResource("function/calendar/index");
  },

  onLoad() {
    getResource<TimeLineItem[]>("function/calendar/index")
      .then((calendar) => {
        this.setData({
          color: getColor(),
          theme: info.theme,
          calendar,
        });
      })
      .catch(() => {
        showModal(
          "获取失败",
          "校历信息获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者",
          () => {
            void this.$back();
          },
        );
      });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/calendar/calendar",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  /** 显示校历详情 */
  showDetail(event: WechatMiniprogram.TouchEvent<{ path: string }>) {
    const { path } = event.detail;

    if (path)
      getResource<CalendarDetail>(`function/calendar/${path}`)
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
