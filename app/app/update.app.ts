import { compareVersion, download } from "@mptool/all";

import { requestJSON } from "../api/index.js";
import { assets, version } from "../config/index.js";
import { appId, platform } from "../state/index.js";

let apkFilePath: string | null = null;

/**
 * 检查 App 更新
 *
 * 如果检测到 App 更新，获取升级状态 (新版本号，是否立即更新、是否重置 App ) 并做相应处理
 *
 * @param globalData  App 的全局数据
 */
export const updateApp = async (): Promise<void> => {
  // 请求配置文件
  const onlineVersion = await requestJSON<string>(`config/${appId}/version`);

  if (compareVersion(onlineVersion, version) > 0) {
    if (platform === "android")
      wx.showModal({
        title: "发现新版本",
        content: `已发现新版本 ${onlineVersion}，是否更新？`,
        confirmText: "更新",
        cancelText: "忽略",
        success: ({ confirm }) => {
          if (confirm) {
            // avoid downloading the same file
            if (apkFilePath) wx.miniapp.installApp({ filePath: apkFilePath });
            else
              download(`${assets}innenu-v${onlineVersion}.apk`).then(
                (filePath) => {
                  apkFilePath = filePath;
                  wx.miniapp.installApp({ filePath });
                },
              );
          }
        },
      });

    // TODO: Complete iOS logic
  }
};
