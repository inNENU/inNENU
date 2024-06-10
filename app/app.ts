import type { TrivialPageInstance } from "@mptool/all";
import { $App, $Config, wrapFunction } from "@mptool/all";

import { INITIALIZED_KEY } from "./config/index.js";
import { info } from "./state/info.js";
import { getGlobalData, initializeApp, startup } from "./utils/app.js";
import { checkResource } from "./utils/resource.js";
import { fetchAppSettings } from "./utils/settings.js";
import type { GlobalData } from "./utils/typings.js";
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
        "activate",
        "admission",
        "calendar",
        "email",
        "grade",
        "library",
        "location",
        "map",
        "music",
        "pe-calculator",
        "phone",
        "reset",
        "school-media",
        "select",
        "video",
        "weather",
        "website",
      ],
      "/function/$name/$name",
    ],
    ["academic-detail", "/function/academic/detail"],
    ["academic-list", "/function/academic/list"],
    ["announcement-detail", "/function/announcement/detail"],
    ["announcement-list", "/function/announcement/list"],
    ["create-archive", "/function/archive/create"],
    ["view-archive", "/function/archive/view"],
    ["change-major-plan", "/function/course/change-major"],
    ["course-table", "/function/course/table"],
    ["exam-place", "/function/course/exam-place"],
    ["special-exam", "/function/grade/special"],
    ["apply-email", "/function/email/apply"],
    ["admission", "/function/enroll/admission"],
    ["post-enroll-plan", "/function/enroll/post-plan"],
    ["under-enroll-plan", "/function/enroll/under-plan"],
    ["under-history-grade", "/function/enroll/under-grade"],
    ["info-detail", "/function/info/detail"],
    ["info-list", "/function/info/list"],
    ["notice-detail", "/function/notice/detail"],
    ["notice-list", "/function/notice/list"],
    ["wechat-detail", "/function/school-media/wechat"],
    ["widget-settings", "/pages/settings/widget"],
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
        this.setData({ darkmode: info.darkmode });
        wx.onThemeChange?.(this.onThemeChange);
      },
    );

    options.onUnload = wrapFunction(
      options.onUnload,
      function (this: TrivialPageInstance & { onThemeChange: () => void }) {
        wx.offThemeChange?.(this.onThemeChange);
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

    // 初始化完成，检查页面资源
    if (wx.getStorageSync(INITIALIZED_KEY)) checkResource();
    // 初次启动执行初始化
    else initializeApp();

    fetchAppSettings(this.globalData, wx.getStorageSync("test")).then(() => {
      this.$emit("settings");
    });
    startup(this.globalData);

    console.info("GlobalData:", this.globalData);
  },

  onAwake(time: number) {
    console.info(`App awakes after ${time}ms`);

    fetchAppSettings(this.globalData, wx.getStorageSync("test")).then(() => {
      this.$emit("settings");
    });
    updateApp();
  },

  onError(errorMsg) {
    console.error("Catch error msg: ", errorMsg);
  },

  onPageNotFound(options) {
    // 重定向到主界面
    wx.switchTab({ url: "pages/main/main" });

    console.error("Page not found:", options);
  },
});
