/* eslint-disable max-lines */
import { logger } from "@mptool/enhance";
import { exists, readJSON, rm, saveFile, unzip, writeJSON } from "@mptool/file";

import { type VersionInfo } from "../../typings/index.js";
import { showToast } from "../api/ui.js";
import { assets, server } from "../config/info.js";

/**
 * 资源下载
 *
 * @param fileName 下载资源名称
 * @param showProgress 是否开启进度提示
 */
export const downloadResource = (
  fileName: string,
  showProgress = true
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (showProgress) wx.showLoading({ title: "下载中...", mask: true });

    // 取消下载成功提示并移除对应资源文件
    fileName.split("-").forEach((resource) => {
      if (resource) {
        wx.setStorageSync(`${resource}Download`, false);
        if (exists(resource)) rm(resource, "dir");
      }
    });

    const downLoadTask = wx.downloadFile({
      url: `${assets}r/${fileName}.zip`,
      success: ({ statusCode, tempFilePath }) => {
        if (statusCode === 200) {
          if (showProgress) wx.showLoading({ title: "保存中...", mask: true });

          // 保存压缩文件到压缩目录
          saveFile(tempFilePath, "zipTemp");

          if (showProgress) wx.showLoading({ title: "解压中...", mask: true });

          // 解压文件到根目录
          unzip("zipTemp", "").then(() => {
            // 删除压缩包
            rm("zipTemp", "file");

            // 将下载成功信息写入存储
            fileName.split("-").forEach((resource) => {
              if (resource) wx.setStorageSync(`${resource}Download`, true);
            });

            // 判断取消提示
            if (showProgress) wx.hideLoading();
            resolve();
          });
        } else {
          reject(statusCode);
        }
      },

      // 下载失败
      fail: ({ errMsg }) => {
        logger.error(`download ${fileName} fail: ${errMsg}`);
        reject(errMsg);
      },
    });

    downLoadTask.onProgressUpdate(({ progress }) => {
      if (showProgress)
        wx.showLoading({ title: `下载中...${progress}%`, mask: true });
    });
  });

let hasResPopup = false;

/**
 * 检查资源更新
 *
 * @param path 检查资源的路径
 * @param name 检查资源的名称
 * @param dataUsage 消耗的数据流量
 */
// eslint-disable-next-line max-lines-per-function
export const checkResource = (): void => {
  /** 资源提醒状态 */
  let notify = wx.getStorageSync<boolean | undefined>("resourceNotify");
  /** 本地资源版本 */
  const localVersion: Record<string, number> = readJSON("version") || {};
  /** 上次更新时间 */
  const localTime = wx.getStorageSync<number | undefined>(`resourceUpdateTime`);
  /** 当前时间 */
  const currentTime = Math.round(new Date().getTime() / 1000);

  // 调试
  logger.debug(
    `Resource Notify status: ${notify ? "open" : "close"}`,
    "Local resource version: ",
    localVersion
  );

  if (currentTime > Number(localTime) + 604800 && !notify) {
    notify = true;
    wx.setStorageSync("resourceNotify", true);
    logger.debug("Resource Notify reset to true after 7 days");
  }

  // 需要检查更新
  if (notify && !hasResPopup)
    wx.request<VersionInfo>({
      url: `${server}service/resource.php`,
      enableHttp2: true,
      method: "POST",
      success: ({ statusCode, data }) => {
        // 资源为最新
        if (statusCode === 200) {
          const updateList: string[] = [];

          for (const key in data.version)
            if (data.version[key] !== localVersion[key]) updateList.push(key);

          // 需要更新
          if (updateList.length > 0) {
            // 调试
            logger.info("Newer resource detected");

            const fileName = updateList.join("-");
            const size = data.size[fileName];

            hasResPopup = true;

            // 需要提醒
            wx.showModal({
              title: "内容更新",
              content: `请更新资源以获得最新内容。(会消耗${size}K流量)`,
              cancelText: "取消",
              cancelColor: "#ff0000",
              confirmText: "更新",
              success: ({ confirm, cancel }) => {
                // 用户确认，下载更新
                if (confirm)
                  downloadResource(fileName).then(() => {
                    writeJSON("version", data.version);
                    hasResPopup = false;
                  });
                // 用户取消，警告用户
                else if (cancel)
                  wx.showModal({
                    title: "更新已取消",
                    content:
                      "您会错过本次新增与修正的内容，导致的后果请您自负!",
                    confirmColor: "#ff0000",
                    confirmText: "确定",
                    showCancel: false,
                  });
              },
            });
          }
          // 调试
          else {
            logger.debug("Newest resource already downloaded");
          }
        } else {
          showToast("服务器出现问题");
        }
      },
      fail: () => showToast("服务器出现问题"),
    });
};
