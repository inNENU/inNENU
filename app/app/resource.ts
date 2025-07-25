import {
  MpError,
  exists,
  logger,
  readJSON,
  rm,
  saveFile,
  showToast,
  unzip,
  writeJSON,
} from "@mptool/all";

import type { ResourceVersionInfo } from "../../typings/index.js";
import { request } from "../api/index.js";
import { assets, server } from "../config/index.js";

export const RESOURCE_NAMES = [
  "apartment",
  "function",
  "guide",
  "icon",
  "intro",
  "newcomer",
  "school",
];

/**
 * 资源下载
 *
 * @param fileName 下载资源名称
 * @param showProgress 是否开启进度提示
 */
export const downloadResource = async (
  fileNames: string[],
  showProgress = true,
): Promise<void> => {
  const total = fileNames.length;
  let progressNumber = 0;

  if (showProgress) wx.showLoading({ title: `更新中(0/${total})`, mask: true });

  // 取消下载成功提示并移除对应资源文件
  await Promise.all(
    fileNames.map((resource) => {
      wx.setStorageSync(`${resource}-download`, false);
      if (exists(resource)) rm(resource, "dir");

      return new Promise<void>((resolve, reject) => {
        wx.downloadFile({
          url: `${assets}${resource}.zip`,
          success: ({ statusCode, tempFilePath }) => {
            if (statusCode === 200) {
              // 判断取消提示
              if (showProgress) {
                progressNumber += 1;
                if (progressNumber === total)
                  wx.showLoading({
                    title: "解压中",
                    mask: true,
                  });
                else
                  wx.showLoading({
                    title: `更新中(${progressNumber}/${total})`,
                    mask: true,
                  });
              }

              // 保存压缩文件到压缩目录
              saveFile(tempFilePath, `${resource}.zip`);

              // 解压文件到根目录
              unzip(`${resource}.zip`, "").then(() => {
                // 删除压缩包
                rm(`${resource}.zip`, "file");

                // 将下载成功信息写入存储
                wx.setStorageSync(`${resource}-download`, true);

                resolve();
              });
            } else {
              reject(new MpError({ code: statusCode }));
            }
          },

          // 下载失败
          fail: ({ errMsg }) => {
            logger.error(`下载资源 ${resource} 失败`, errMsg);
            reject(new MpError({ message: errMsg }));
          },
        });
      });
    }),
  );

  if (showProgress) wx.hideLoading();
};

let hasResPopup = false;

/**
 * 检查资源更新
 *
 * @param path 检查资源的路径
 * @param name 检查资源的名称
 * @param dataUsage 消耗的数据流量
 */

export const checkResource = (): Promise<void> => {
  /** 资源提醒状态 */
  let disableNotify = wx.getStorageSync<boolean | undefined>(
    "disableResourceNotify",
  );
  /** 本地资源版本 */
  const localVersion: Record<string, number> =
    readJSON("resource-version") || {};
  /** 上次更新时间 */
  const localTime = wx.getStorageSync<number | undefined>(
    `resource-update-time`,
  );
  /** 当前时间 */
  const currentTime = Math.round(Date.now() / 1000);

  // 调试
  logger.debug(`Resource Notify status: ${disableNotify ? "close" : "open"}`);
  logger.debug("Local resource version: ", localVersion);

  if (currentTime > Number(localTime) + 604800 && disableNotify) {
    disableNotify = true;
    wx.setStorageSync("disableResourceNotify", false);
    logger.debug("Enable resource notify after 7 days");
  }

  // 需要检查更新
  if (!disableNotify && !hasResPopup)
    return request<ResourceVersionInfo>(`${server}service/version.php`, {
      method: "POST",
    })
      .then(({ data }) => {
        const updateList: string[] = [];

        for (const key in data.version)
          if (data.version[key] !== localVersion[key]) updateList.push(key);

        // 需要更新
        if (updateList.length > 0) {
          // 调试
          logger.debug("New resource detected");

          const size = updateList.reduce(
            (sum, item) => sum + data.size[item],
            0,
          );

          hasResPopup = true;

          // 需要提醒
          wx.showModal({
            title: "内容更新",
            content: `请更新资源以获得最新内容 (大小${size}KB)`,
            cancelText: "取消",
            cancelColor: "#ff0000",
            confirmText: "更新",
            theme: "day",
            success: ({ confirm, cancel }) => {
              // 用户确认，下载更新
              if (confirm)
                downloadResource(updateList).then(() => {
                  writeJSON("resource-version", data.version);
                  hasResPopup = false;
                });
              // 用户取消，警告用户
              else if (cancel)
                wx.showModal({
                  title: "更新已取消",
                  content: "您会错过本次新增与修正的内容，导致的后果请您自负!",
                  confirmColor: "#ff0000",
                  confirmText: "确定",
                  showCancel: false,
                  theme: "day",
                });
            },
          });
        }
        // 调试
        else {
          logger.debug("Resource up to date");
        }
      })
      .catch((err: unknown) => {
        logger.error("资源检查失败", err);
        showToast("服务器出现问题");
      });

  return Promise.resolve();
};
