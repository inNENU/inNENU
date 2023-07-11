import { logger } from "@mptool/enhance";
import { ls, rm } from "@mptool/file";

import { type GlobalData } from "./app.js";
import { requestJSON } from "../api/net.js";
import { showToast } from "../api/ui.js";

interface UpdateInfo {
  /** 是否进行强制更新 */
  forceUpdate: boolean;
  /** 是否进行强制初始化 */
  reset: boolean;
}

/**
 * 检查小程序更新
 *
 * 如果检测到小程序更新，获取升级状态 (新版本号，是否立即更新、是否重置小程序) 并做相应处理
 *
 * @param globalData 小程序的全局数据
 */
export const updateApp = (globalData: GlobalData): void => {
  const updateManager = wx.getUpdateManager?.();

  if (updateManager) {
    // 检查更新
    updateManager.onCheckForUpdate(({ hasUpdate }) => {
      // 找到更新，提示用户获取到更新
      if (hasUpdate) showToast("发现小程序更新，下载中...");
    });

    updateManager.onUpdateReady(() => {
      // 请求配置文件
      requestJSON<string>(`r/config/${globalData.appID}/version`)
        .then((version) =>
          // 请求配置文件
          requestJSON<UpdateInfo>(
            `r/config/${globalData.appID}/${version}/config`,
          )
            .then(({ forceUpdate, reset }) => {
              // 更新下载就绪，提示用户重新启动
              wx.showModal({
                title: "已找到新版本",
                content: `新版本${version}已下载，请重启应用更新。${
                  reset ? "该版本会初始化小程序。" : ""
                }`,
                showCancel: !reset && !forceUpdate,
                confirmText: "应用",
                cancelText: "取消",
                success: ({ confirm }) => {
                  // 用户确认，应用更新
                  if (confirm) {
                    // 需要初始化
                    if (reset) {
                      // 显示提示
                      wx.showLoading({ title: "初始化中", mask: true });

                      // 清除文件系统文件与数据存储
                      ls("").forEach((filePath) => rm(filePath));
                      wx.clearStorageSync();

                      // 隐藏提示
                      wx.hideLoading();
                    }

                    // 应用更新
                    updateManager.applyUpdate();
                  }
                },
              });
            })
            .catch(() => {
              // 调试信息
              logger.warn(`config file error`);
            }),
        )
        .catch(() => {
          // 调试信息
          logger.warn(`version file error`);
        });
    });

    // 更新下载失败
    updateManager.onUpdateFailed(() => {
      // 提示用户网络出现问题
      showToast("小程序更新下载失败，请检查您的网络!");

      // 调试
      logger.warn("Update App failed because of Net Error");
    });
  }
};