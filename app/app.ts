import {
  $App,
  $Config,
  type TrivialPageInstance,
  wrapFunction,
} from "@mptool/enhance";

import { getDarkmode } from "./utils/api.js";
import {
  type GlobalData,
  getGlobalData,
  initializeApp,
  startup,
  updateApp,
  updateNotice,
} from "./utils/app.js";
import { checkResource } from "./utils/resource.js";

export interface AppOption {
  globalData: GlobalData;
}

$Config({
  defaultRoute: "/pages/$name/$name",
  routes: [
    [
      [
        "admission",
        "calendar",
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
    ["enroll-grade", "/function/enroll/grade"],
    ["enroll-plan", "/function/enroll/plan"],
    ["wechat-detail", "/function/school-media/wechat"],
    [["about", "account", "privacy", "storage"], "/settings/$name/$name"],
  ],

  injectPage: (_name, options) => {
    options.onThemeChange =
      (options.onThemeChange as (
        this: TrivialPageInstance,
        { theme }: WechatMiniprogram.OnThemeChangeListenerResult
      ) => void | undefined) ||
      function (
        this: TrivialPageInstance,
        { theme }: WechatMiniprogram.OnThemeChangeListenerResult
      ): void {
        this.setData({ darkmode: theme === "dark" });
      };

    options.onLoad = wrapFunction(
      options.onLoad,
      function (this: TrivialPageInstance & { onThemeChange: () => void }) {
        if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);
      }
    );

    options.onUnload = wrapFunction(
      options.onUnload,
      function (this: TrivialPageInstance & { onThemeChange: () => void }) {
        if (wx.canIUse("offThemeChange")) wx.offThemeChange(this.onThemeChange);
      }
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
    this.globalData.darkmode = getDarkmode();

    updateNotice(this.globalData);
    updateApp(this.globalData);
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
