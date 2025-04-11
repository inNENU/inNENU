import { emitter, logger, writeJSON } from "@mptool/all";

import { RESOURCE_NAMES, downloadResource } from "./resource.js";
import type { ResourceVersionInfo } from "../../typings/index.js";
import { request } from "../api/index.js";
import { INITIALIZED_KEY, server } from "../config/index.js";
import { platform } from "../state/index.js";

/** 初始化小程序 */
export const initializeApp = (): void => {
  logger.debug("First launch");

  // 提示用户正在初始化
  wx.showLoading({ title: "初始化中...", mask: true });

  wx.setStorageSync(
    "themeIndex",
    platform === "android" ? 1 : platform === "windows" ? 3 : 0,
  );

  downloadResource(RESOURCE_NAMES, false)
    .then(() => {
      // 下载资源文件并写入更新时间
      wx.setStorageSync("resource-update-time", Math.round(Date.now() / 1000));

      return request<ResourceVersionInfo>(`${server}service/version.php`).then(
        ({ data }) => data,
      );
    })
    .then((data) => {
      logger.debug("Version info", data);
      writeJSON("resource-version", data.version);
      // 成功初始化
      wx.setStorageSync(INITIALIZED_KEY, true);
      emitter.emit("inited");
      wx.hideLoading();
    });
};
