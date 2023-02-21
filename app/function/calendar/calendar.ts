import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app";
import { type TimeLineItem } from "../../components/timeline/timeline";
import { modal, tip } from "../../utils/api";
import { appCoverPrefix } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/json";
import { getColor, popNotice } from "../../utils/page";

const { globalData } = getApp<AppOption>();

interface CalendarDetail {
  title: string;
  content: TimeLineItem[];
}

$Page("calendar", {
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

    popNotice("calendar");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: "东师校历",
    path: "/function/calendar/calendar",
  }),

  onShareTimeline: () => ({ title: "东师校历" }),

  onAddToFavorites: () => ({
    title: "东师校历",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  /** 显示校历详情 */
  display(event: WechatMiniprogram.TouchEvent<{ path: string }>) {
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
