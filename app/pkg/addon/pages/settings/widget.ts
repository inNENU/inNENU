import { $Page, get, set } from "@mptool/all";

import { confirmAction } from "../../../../api/index.js";
import { WIDGET_KEY } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type { WidgetInfo } from "../../../../widgets/config.js";
import { DEFAULT_WIDGETS, WIDGETS } from "../../../../widgets/config.js";
import type { WidgetConfig } from "../../../../widgets/utils.js";
import { getSize } from "../../../../widgets/utils.js";

const PAGE_ID = "widget-settings";
const PAGE_TITLE = "小组件设置";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,
    theme: info.theme,
    darkmode: info.darkmode,
    style: "",

    addPopup: {
      title: "新增组件",
      confirm: false,
      cancel: false,
    },

    WIDGETS,

    current: null as WidgetInfo | null,
    swiperIndex: 0,
    widgets: [] as WidgetConfig[],
  },

  state: {
    swiperIndex: 0,
  },

  onLoad() {
    const { darkmode, theme } = info;
    const widgets = get<WidgetConfig[]>(WIDGET_KEY) || DEFAULT_WIDGETS;

    this.setData({
      darkmode,
      theme,
      color: getPageColor(),
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
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  showPopup() {
    this.setData({ display: true, style: "overflow:hidden" });
  },

  selectWidget({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;

    this.setData({
      current: WIDGETS[index],
      swiperIndex: 0,
    });
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
    this.setData({
      display: false,
      current: null,
      swiperIndex: 0,
      style: "",
    });
  },
});
