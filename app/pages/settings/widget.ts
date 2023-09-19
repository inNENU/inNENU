import { $Page, get, set } from "@mptool/all";

import { confirmAction } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { WIDGET_KEY } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import { WidgetConfig, getSize } from "../../widgets/utils.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "widget-settings";
const PAGE_TITLE = "小组件设置";

interface WidgetInfo {
  tag: string;
  name: string;
  types: string[];
}

const WIDGETS: WidgetInfo[] = [
  {
    tag: "card",
    name: "校园卡",
    types: ["校园卡余额 (小)"],
  },
  {
    tag: "course",
    name: "课程表",
    types: ["今日课程 (小)", "下节课程 (小)", "今日课程", "课程表 (大)"],
  },
  {
    tag: "email",
    name: "校园邮箱",
    types: ["未读邮件 (小)", "最近邮件 (小)", "最近邮件", "最近邮件 (大)"],
  },
  {
    tag: "recent-info",
    name: "官网信息",
    types: [
      "官网通知 (小)",
      "官网通知",
      "官网通知 (大)",
      "官网新闻 (小)",
      "官网新闻",
      "官网新闻 (大)",
      "学术会议 (小)",
      "学术会议",
      "学术会议 (大)",
    ],
  },
  {
    tag: "starred-info",
    name: "官网收藏",
    types: ["官网收藏 (小)", "官网收藏", "官网收藏 (大)"],
  },
  {
    tag: "recent-notice",
    name: "学校通知",
    types: ["通知 (小)", "通知", "通知 (大)", "新闻 (小)", "新闻", "新闻 (大)"],
  },
  {
    tag: "starred-notice",
    name: "通知收藏",
    types: ["通知收藏 (小)", "通知收藏", "通知收藏 (大)"],
  },
  {
    tag: "library-borrow",
    name: "图书馆借阅",
    types: ["借阅书目 (小)", "图书待还 (小)"],
  },
  {
    tag: "library-people",
    name: "图书馆人数",
    types: ["图书馆人数 (小)"],
  },
  {
    tag: "weather",
    name: "学校天气",
    types: [
      "今日天气 (小)",
      "今日天气",
      "近日天气 (小)",
      "近日天气",
      "近日天气 (大)",
    ],
  },
];

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,

    addPopup: {
      title: "新增组件",
      confirm: "添加组件",
      cancel: false,
    },

    WIDGETS,

    current: <WidgetInfo | null>null,
    swiperIndex: 0,
    widgets: <WidgetConfig[]>[],
  },

  state: {
    swiperIndex: 0,
  },

  onLoad() {
    const { darkmode, theme } = globalData;
    const widgets = get<WidgetConfig[]>(WIDGET_KEY) || [];

    this.setData({
      darkmode,
      theme,
      color: getColor(),
      indicatorColor: darkmode
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.15)",
      indicatorActiveColor: darkmode
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.45)",
      widgets,
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/settings/widget",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  showPopup() {
    this.setData({ display: true });
  },

  selectWidget({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;

    this.setData({ current: WIDGETS[index], swiperIndex: 0 });
  },

  swiperChange({ detail }: WechatMiniprogram.SwiperChange) {
    this.setData({ swiperIndex: detail.current });
  },

  addWidget() {
    const { current, swiperIndex, widgets } = this.data;
    const type = current!.types[swiperIndex];

    const newWidgets = [
      ...widgets,
      {
        tag: current!.tag,
        type,
        size: getSize(type),
      },
    ];

    this.setData({ widgets: newWidgets });
    set(WIDGET_KEY, newWidgets);

    this.close();
  },

  removeWidget({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    confirmAction("移除此组件", () => {
      const { index } = currentTarget.dataset;
      const { widgets } = this.data;

      const newWidgets = widgets.filter((_, i) => i !== index);

      this.setData({ widgets: newWidgets });
      set(WIDGET_KEY, newWidgets);
    });
  },

  capture() {
    // do nothing
  },

  close() {
    this.setData({ display: false, current: null, swiperIndex: 0 });
  },
});
