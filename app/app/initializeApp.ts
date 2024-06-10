/* eslint-disable max-lines */
import { emitter, logger, writeJSON } from "@mptool/all";

import type { VersionInfo } from "../../typings/index.js";
import { request } from "../api/index.js";
import { DEFAULT_CONFIG, INITIALIZED_KEY, server } from "../config/index.js";
import { defaultResources, downloadResource } from "../utils/index.js";

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
