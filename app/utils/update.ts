import { logger, ls, rm } from "@mptool/all";

import { AppSettings } from "./settings.js";
import { request, showToast } from "../api/index.js";
import { server } from "../config/info.js";
import { info } from "../state/info.js";

export interface UpdateInfo {
  /** 是否进行强制更新 */
  force: boolean;
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
export const updateApp = (): void => {
  const updateManager = wx.getUpdateManager?.();

  if (updateManager) {
    // 检查更新
    updateManager.onCheckForUpdate(({ hasUpdate }) => {
      // 找到更新，提示用户获取到更新
      if (hasUpdate) showToast("发现小程序更新，下载中...");
    });

    updateManager.onUpdateReady(() => {
      // 请求配置文件
      request<string>(`${server}service/app-version.php`, {
        method: "POST",
        body: {
          appID: info.appID,
        },
      })
        .then(({ data: version }) =>
          // 请求配置文件
          request<AppSettings>(`${server}service/settings.php`, {
            method: "POST",
            body: {
              version,
              appID: info.appID,
            },
          })
            .then(({ data: { update } }) => {
              // 更新下载就绪，提示用户重新启动
              wx.showModal({
                title: "已找到新版本",
                content: `新版本${version}已下载，请重启应用更新。${
                  update.reset ? "该版本会初始化小程序。" : ""
                }`,
                showCancel: !update.reset && !update.force,
                confirmText: "应用",
                cancelText: "取消",
                theme: "day",
                success: ({ confirm }) => {
                  // 用户确认，应用更新
                  if (confirm) {
                    // 需要初始化
                    if (update.reset) {
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
