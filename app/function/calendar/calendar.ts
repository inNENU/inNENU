import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app.js";
import { type TimeLineItem } from "../../components/timeline/timeline.js";
import { modal, tip } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "calendar";
const PAGE_TITLE = "东师校历";

interface CalendarDetail {
  title: string;
  content: TimeLineItem[];
}

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    calendar: <TimeLineItem[]>[],
    calendarDetail: <TimeLineItem[]>[],
    popupConfig: {
      title: "校历详情",
      cancel: false,
    },
  },

  onNavigate() {
    ensureJSON("function/calendar/index");
  },

  onLoad() {
    getJSON<TimeLineItem[]>("function/calendar/index")
      .then((calendar) => {
        this.setData({
          color: getColor(),
          theme: globalData.theme,
          firstPage: getCurrentPages().length === 1,
          calendar,
        });
      })
      .catch(() => {
        modal(
          "获取失败",
          "校历信息获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者",
          () => this.back()
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
      getJSON<CalendarDetail>(`function/calendar/${path}`)
        .then((data) => {
          this.setData({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "popupConfig.title": data.title,
            calendarDetail: data.content,
            display: true,
          });
        })
        .catch(() => {
          modal(
            "获取失败",
            "学期详情获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者"
          );
        });
    else tip("所选内容暂无详情");
  },

  /** 关闭校历详情 */
  close() {
    this.setData({ display: false });
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});
