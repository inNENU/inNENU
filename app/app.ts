import type { TrivialPageInstance } from "@mptool/all";
import { $App, $Config, logger, wrapFunction } from "@mptool/all";

import type { GlobalData } from "./app/index.js";
import {
  checkResource,
  globalData,
  initializeApp,
  startup,
  syncAppSettings,
  updateApp,
} from "./app/index.js";
import { INITIALIZED_KEY } from "./config/index.js";
import { appInfo } from "./state/index.js";

export interface App {
  globalData: GlobalData;
}

$Config({
  home: "/pages/main/main",

  getPath: (pageName) => {
    // handle main package
    if (
      ["main", "function", "guide", "intro", "user", "info"].includes(pageName)
    )
      return `/pages/${pageName}/${pageName}`;

    // handle addon sub package
    if (
      [
        "about",
        "action",
        "license",
        "privacy",
        "search",
        "settings",
        "web",
      ].includes(pageName)
    )
      return `/pkg/addon/pages/${pageName}/${pageName}`;
    if (pageName === "widget-settings")
      return `/pkg/addon/pages/settings/widget`;

    // handle multi-word path in account sub package
    if (["change-major", "exam-place"].includes(pageName))
      return `/pkg/user/pages/${pageName}/${pageName}`;

    if (pageName === "under-major-plan")
      return "/pkg/tool/pages/major-plan/under";

    // handle info sub package
    if (
      [
        "admission",
        "calendar",
        "map",
        "music",
        "pe-calculator",
        "phone",
        "school-media",
        "video",
        "weather",
        "website",
        "wechat",
      ].includes(pageName)
    )
      return `/pkg/tool/pages/${pageName}/${pageName}`;

    if (pageName === "under-course-table")
      return "/pkg/user/pages/course-table/under";

    const name = pageName.startsWith("under-")
      ? pageName.slice(6) + "-under"
      : pageName.startsWith("grad-")
        ? pageName.slice(5) + "-grad"
        : pageName;

    const [, dir, file] = name.includes("-")
      ? /^([^-]+)-(.*)$/.exec(name)!
      : [null, name, name];

    if (["calendar", "enroll", "map", "official"].includes(dir))
      return `/pkg/tool/pages/${dir}/${file}`;

    return `/pkg/user/pages/${dir}/${file}`;
  },

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
        this.setData({ darkmode: appInfo.darkmode });
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

$App<App>({
  /** 全局数据 */
  globalData,

  onLaunch(options) {
    // 调试
    logger.debug("App launched with options", options);

    // 初始化完成，检查页面资源
    if (wx.getStorageSync(INITIALIZED_KEY)) checkResource();
    // 初次启动执行初始化
    else initializeApp();

    syncAppSettings(this.globalData, wx.getStorageSync("test")).then(() => {
      this.$emit("settings");
    });
    startup(this.globalData);

    logger.debug("GlobalData", this.globalData);
  },

  onAwake(time: number) {
    logger.debug(`App awakes after ${time}ms`);

    syncAppSettings(this.globalData, wx.getStorageSync("test")).then(() => {
      this.$emit("settings");
    });
    updateApp();
  },

  onError(errorMsg) {
    logger.error("Catch error msg: ", errorMsg);
  },

  onPageNotFound(options) {
    // 重定向到主界面
    wx.switchTab({ url: "pages/main/main" });

    logger.error("Page not found:", options);
  },
});
