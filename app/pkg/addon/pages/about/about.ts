import { $Page, set, showToast, writeClipboard } from "@mptool/all";

import type {
  FunctionalListComponentConfig,
  PageStateWithContent,
  SwitchListComponentItemConfig,
} from "../../../../../typings/index.js";
import { syncAppSettings } from "../../../../app/index.js";
import type { App } from "../../../../app.js";
import {
  DAY,
  appCoverPrefix,
  appName,
  version,
} from "../../../../config/index.js";
import { reportUserInfo } from "../../../../service/index.js";
import { appInfo, info, updateSelectable } from "../../../../state/index.js";
import { resolvePage, setPage, showNotice } from "../../../../utils/index.js";

const { globalData } = getApp<App>();
let clickNumber = 0;
let developMode = false;

const PAGE_ID = "about";
const PAGE_TITLE = "关于";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    darkmode: appInfo.darkmode,
    page: {
      title: `关于 ${appName}`,
      desc: `当前版本: ${version}`,
      grey: true,
      content: [
        {
          tag: "functional-list",
          header: "版本号",
          items: [
            { text: version, type: "button", handler: "debugMode" },
            {
              text: "允许复制",
              type: "switch",
              key: "selectable",
              handler: "toggleSelectable",
            },
            {
              text: "启用测试功能",
              type: "switch",
              key: "test",
              handler: "toggleTest",
            },
            {
              text: "调试开关",
              type: "switch",
              key: "debugMode",
              handler: "toggleDebug",
            },
            {
              text: "打开功能页",
              url: "action?action=all",
            },
            { text: "复制用户APPID", type: "button", handler: "copyAppID" },
            { text: "退出开发者模式", type: "button", handler: "debugMode" },
          ],
        },
      ],
    } as PageStateWithContent,
  },

  onNavigate(res) {
    const { page } = this.data;

    // 读取开发者模式并对页面显示做相应改变
    developMode =
      wx.getStorageSync<boolean | undefined>("developMode") ?? false;

    if (!developMode)
      (page.content[0] as FunctionalListComponentConfig).items.forEach(
        (x, y) => {
          x.hidden = y !== 0;
        },
      );

    resolvePage(res, page);
  },

  onLoad(option) {
    if (globalData.page.id === "关于") {
      setPage({ option, ctx: this });
    } else {
      const { page } = this.data;

      // 读取开发者模式并对页面显示做相应改变
      developMode =
        wx.getStorageSync<boolean | undefined>("developMode") ?? false;

      if (!developMode)
        (page.content[0] as FunctionalListComponentConfig).items.forEach(
          (x, y) => {
            x.hidden = y !== 0;
          },
        );

      setPage({ option: { id: "about" }, ctx: this }, page);
    }

    this.$on("settings", () => this.setPage());
  },

  onShow() {
    this.setPage();
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  loadPage(): PageStateWithContent | null {
    if (!globalData.settings) return null;

    const { about } = globalData.settings;

    const aboutPage = {
      ...this.data.page,
      content: this.data.page.content.slice(0, 1).concat(about),
    };

    set(PAGE_ID, aboutPage, 3 * DAY);

    return aboutPage;
  },

  setPage(): void {
    try {
      const pageData = this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch {
      // do nothing
    }
  },

  /** 点击版本号时触发的函数 */
  debugMode() {
    // 关闭开发者模式
    if (developMode) {
      wx.setStorageSync("developMode", false);
      (
        this.data.page.content[0] as FunctionalListComponentConfig
      ).items.forEach((x, y) => {
        x.hidden = y !== 0;
      });
      this.setData({ page: this.data.page });
      clickNumber = 0;
      developMode = false;

      // 不做任何操作
    } else if (clickNumber < 5) {
      clickNumber += 1;
    }
    // 提示还有几次点击即可启用开发者模式
    else if (clickNumber < 10) {
      showToast(`再点击${10 - clickNumber}次即可启用开发者模式`);
      clickNumber += 1;
    }
    // 启用开发者模式
    else {
      this.setData({ debug: true }, () =>
        wx.nextTick(() => {
          this.setData({ focus: true });
        }),
      );
    }
  },

  /**
   * 接管密码输入
   * 用于判断密码是否正确并启用开发者模式
   *
   * @param event 输入事件
   */
  onInput(event: WechatMiniprogram.Input) {
    if (event.detail.value.length === 7) {
      // 密码正确
      if (event.detail.value === "5201314") {
        showToast("已启用开发者模式");
        (
          this.data.page.content[0] as FunctionalListComponentConfig
        ).items.forEach((x) => {
          x.hidden = false;
        });
        this.setData({ page: this.data.page, debug: false });
        wx.setStorageSync("developMode", true);
        developMode = true;
      } else {
        // 密码错误
        wx.showToast({
          title: "密码错误",
          icon: "none",
          duration: 1000,
          image: "/icon/error.png",
        });
        this.setData({ debug: false });
      }

      // 清空输入框
      event.detail.value = "";
    }

    return event.detail.value;
  },

  /** 取消输入 */
  cancelInput() {
    this.setData({ debug: false });
  },

  /**
   * 控制调试开关
   *
   * @param value 开关状态
   */
  toggleDebug(value: boolean) {
    (
      (this.data.page.content[0] as FunctionalListComponentConfig)
        .items[3] as SwitchListComponentItemConfig
    ).status = value;
    this.setData({ page: this.data.page });
    wx.setStorageSync("debugMode", value);
    wx.setEnableDebug({ enableDebug: value });
    (wx.env as Record<string, unknown>).DEBUG = value;
  },

  /**
   * 控制复制开关
   *
   * @param value 开关状态
   */
  toggleSelectable(value: boolean) {
    updateSelectable(value);
  },

  /**
   * 控制测试功能开关
   *
   * @param value 开关状态
   */
  toggleTest(value: boolean) {
    showToast(`已${value ? "启用" : "关闭"}测试功能`);
    syncAppSettings(globalData, value);
  },

  /**
   * 复制 APPID
   */
  copyAppID() {
    writeClipboard(wx.getStorageSync("openid"));
  },

  reportInfo() {
    reportUserInfo();
  },
});
