import {
  $App,
  $Config,
  type TrivialPageInstance,
  wrapFunction,
} from "@mptool/enhance";

import { getDarkmode } from "./api/ui.js";
import {
  type GlobalData,
  getGlobalData,
  initializeApp,
  startup,
} from "./utils/app.js";
import { updateNotice } from "./utils/notice.js";
import { checkResource } from "./utils/resource.js";
import { updateApp } from "./utils/update.js";

export interface AppOption {
  globalData: GlobalData;
}

$Config({
  home: "/pages/main/main",
  defaultRoute: "/pages/$name/$name",
  routes: [
    [
      [
        "admission",
        "calendar",
        "library",
        "location",
        "map",
        "music",
        "pe-calculator",
        "phone",
        "school-media",
        "select",
        "video",
        "weather",
        "website",
      ],
      "/function/$name/$name",
    ],
    ["admission", "/function/enroll/admission"],
    ["grade-list", "/function/course/grade"],
    ["course-table", "/function/course/table"],
    ["enroll-grade", "/function/enroll/grade"],
    ["enroll-plan", "/function/enroll/plan"],
    ["notice-detail", "/function/notice/detail"],
    ["notice-list", "/function/notice/list"],
    ["wechat-detail", "/function/school-media/wechat"],
    [["about", "account", "privacy", "storage"], "/settings/$name/$name"],
  ],

  injectPage: (_name, options) => {
    options.onThemeChange =
      (options.onThemeChange as (
        this: TrivialPageInstance,
        { theme }: WechatMiniprogram.OnThemeChangeListenerResult,
      ) => void | undefined) ||
      function (
        this: TrivialPageInstance,
        { theme }: WechatMiniprogram.OnThemeChangeListenerResult,
      ): void {
        this.setData({ darkmode: theme === "dark" });
      };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    options.back =
      options.back ||
      function (this: TrivialPageInstance): void {
        if (getCurrentPages().length === 1) this.$switch("main");
        else this.$back();
      };

    options.onLoad = wrapFunction(
      options.onLoad,
      function (this: TrivialPageInstance & { onThemeChange: () => void }) {
        this.setData({ darkmode: getDarkmode() });
        if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);
      },
    );

    options.onUnload = wrapFunction(
      options.onUnload,
      function (this: TrivialPageInstance & { onThemeChange: () => void }) {
        if (wx.canIUse("offThemeChange")) wx.offThemeChange(this.onThemeChange);
      },
    );
  },
});

$App<AppOption>({
  /** 全局数据 */
  globalData: getGlobalData(),

  onLaunch(options) {
    // 调试
    console.info("App launched with options:", options);

    // 如果初次启动执行初始化
    if (!wx.getStorageSync("app-inited")) initializeApp();

    startup(this.globalData);

    console.info("GlobalData:", this.globalData);
  },

  onShow() {
    //初始化完成，检查页面资源
    if (wx.getStorageSync("app-inited")) checkResource();
  },

  onAwake(time: number) {
    console.info(`App awakes after ${time}ms`);

    // 重新应用夜间模式、
    this.globalData.darkmode = wx.getSystemInfoSync().theme === "dark";

    updateApp(this.globalData);
    updateNotice(this.globalData);
  },

  onError(errorMsg) {
    console.error("Catch error msg: ", errorMsg);
  },

  onPageNotFound(msg) {
    // 重定向到主界面
    wx.switchTab({ url: "pages/main/main" });

    console.warn("Page not found:", msg);
  },

  onThemeChange({ theme }) {
    this.globalData.darkmode = theme === "dark";
  },
});
