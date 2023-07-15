import {
  $App,
  $Config,
  type CookieStore,
  type TrivialPageInstance,
  wrapFunction,
} from "@mptool/all";

import { cookieStore } from "./api/cookie.js";
import { getDarkmode } from "./api/ui.js";
import {
  type GlobalData,
  getGlobalData,
  initializeApp,
  startup,
} from "./utils/app.js";
import { checkResource } from "./utils/resource.js";
import { updateSettings } from "./utils/settings.js";
import { updateApp } from "./utils/update.js";

export interface AppOption {
  globalData: GlobalData;
  cookieStore: CookieStore;
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
    ["course-grade", "/function/course/grade"],
    ["course-table", "/function/course/table"],
    ["enroll-grade", "/function/enroll/grade"],
    ["enroll-plan", "/function/enroll/plan"],
    ["info-detail", "/function/info/detail"],
    ["info-list", "/function/info/list"],
    ["notice-detail", "/function/notice/detail"],
    ["notice-list", "/function/notice/list"],
    ["wechat-detail", "/function/school-media/wechat"],
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

  /** Cookie 存储器 */
  cookieStore,

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
    updateSettings(this.globalData);
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
