/* eslint-disable max-lines */
import { emitter, logger, writeJSON } from "@mptool/all";

import { platformActions } from "./app-platform.js";
import { login } from "./login.js";
import { defaultResources, downloadResource } from "./resource.js";
import type { ServiceSettings } from "./settings.js";
import type { GlobalData } from "./typings.js";
import { updateApp } from "./update.js";
import type { VersionInfo } from "../../typings/index.js";
import { getCurrentRoute, request, showToast } from "../api/index.js";
import { DEFAULT_CONFIG, INITIALIZED_KEY, server } from "../config/index.js";
import { info } from "../state/info.js";
import { setOpenid } from "../state/user.js";

const { env, envName } = info;

/** 初始化小程序 */
export const initializeApp = (): void => {
  // 提示用户正在初始化
  wx.showLoading({ title: "初始化中...", mask: true });
  logger.info("First launch");

  // 写入预设数据
  Object.entries(DEFAULT_CONFIG).forEach(([key, data]) => {
    wx.setStorageSync(key, data);
  });

  // 主题为 auto
  if (DEFAULT_CONFIG.theme === "auto") {
    let num;
    let theme;
    const { platform } = (wx.getDeviceInfo || wx.getSystemInfoSync)();

    // 根据平台设置主题
    switch (platform) {
      case "android":
        theme = "android";
        num = 1;
        break;
      case "windows":
        theme = "nenu";
        num = 3;
        break;
      case "ios":
      default:
        theme = "ios";
        num = 0;
    }

    wx.setStorageSync("theme", theme);
    wx.setStorageSync("themeNum", num);
  } else {
    wx.setStorageSync("theme", DEFAULT_CONFIG.theme);
    wx.setStorageSync("themeNum", DEFAULT_CONFIG.themeNum);
  }

  downloadResource(defaultResources, false)
    .then(() => {
      // 下载资源文件并写入更新时间
      wx.setStorageSync("resource-update-time", Math.round(Date.now() / 1000));

      return request<VersionInfo>(`${server}service/version.php`).then(
        ({ data }) => data,
      );
    })
    .then((data) => {
      console.log("Version info", data);
      writeJSON("resource-version", data.version);
      // 成功初始化
      wx.setStorageSync(INITIALIZED_KEY, true);
      emitter.emit("inited");
      wx.hideLoading();
    });
};

export const getGlobalData = (): GlobalData => ({
  page: {
    data: {},
    id: "",
  },
  settings: null,
  service: wx.getStorageSync<ServiceSettings>("service") || {
    forceOnline: false,
  },
});

/** 注册全局监听 */
const registerActions = (): void => {
  const debug = wx.getStorageSync<boolean | undefined>("debugMode") || false;

  // 设置调试
  wx.setEnableDebug({ enableDebug: debug });
  (wx.env as Record<string, unknown>).DEBUG = debug;

  // 获取网络信息
  wx.getNetworkType({
    success: ({ networkType }) => {
      if (networkType === "none") showToast("没有网络连接");
    },
  });

  // 设置内存不足警告
  wx.onMemoryWarning((res) => {
    console.warn("Memory warning received.");
    wx.reportEvent?.("memory_warning", {
      level: res?.level || 0,
    });
  });

  // 监听网络状态
  wx.onNetworkStatusChange(({ isConnected }) => {
    // 显示提示
    if (!isConnected) {
      showToast(`网络连接中断,部分${envName}功能暂不可用`);
      wx.setStorageSync("networkError", true);
    } else if (wx.getStorageSync("network")) {
      wx.setStorageSync("networkError", false);
      showToast("网络连接恢复");
    }
  });

  // 监听用户截屏
  if (
    ["wx", "qq"].includes(env) &&
    wx.getStorageSync("capture-screen") !== "never"
  ) {
    // avoid duplicate modal on QQ
    let isDisplayingModal = false;

    wx.onUserCaptureScreen?.(() => {
      const status = wx.getStorageSync<"never" | "noticed" | undefined>(
        "capture-screen",
      );

      if (status !== "never" && !isDisplayingModal) {
        isDisplayingModal = true;
        wx.showModal({
          title: `善用${envName}分享`,
          content: `您可以点击右上角选择分享到好友、分享到朋友圈/空间\n您也可以点击页面右下角的分享图标，选择保存${envName}二维码并分享`,
          showCancel: status === "noticed",
          cancelText: "不再提示",
          theme: "day",
          success: ({ cancel, confirm }) => {
            if (confirm) {
              wx.setStorageSync("capture-screen", "noticed");
            } else if (cancel) {
              wx.setStorageSync("capture-screen", "never");
              if (wx.canIUse("offUserCaptureScreen")) wx.offUserCaptureScreen();
            }

            isDisplayingModal = false;
          },
        });
      }
    });
  }
};

/**
 * 小程序启动时的运行函数
 *
 * 负责检查通知与小程序更新，注册网络、内存、截屏的监听
 *
 * @param globalData 小程序的全局数据
 */
export const startup = (globalData: GlobalData): void => {
  registerActions();
  login(({ openid, inBlacklist }) => {
    setOpenid(openid);
    if (inBlacklist && getCurrentRoute() !== "pages/action/action")
      wx.reLaunch({ url: "/pages/action/action?action=blacklist" });
  });
  platformActions(globalData);
  updateApp();
};
