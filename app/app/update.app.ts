import { downLoad, requestJSON } from "../api/index.js";
import { assets } from "../config/index.js";
import { appID, info } from "../state/index.js";
import { compareVersion } from "../utils/index.js";

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
  const onlineVersion = await requestJSON<string>(`d/config/${appID}/version`);

  if (compareVersion(onlineVersion, info.version) > 0) {
    if (info.platform === "android")
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
              downLoad(`${assets}innenu-v${onlineVersion}.apk`).then(
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
