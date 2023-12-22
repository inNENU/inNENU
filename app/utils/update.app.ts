import type { GlobalData } from "./typings.js";
import { compareVersion } from "./version.js";
import { downLoad, requestJSON, showModal } from "../api/index.js";
import { assets } from "../config/index.js";

let apkFilePath: string | null = null;

/**
 * 检查 App 更新
 *
 * 如果检测到 App 更新，获取升级状态 (新版本号，是否立即更新、是否重置 App ) 并做相应处理
 *
 * @param globalData  App 的全局数据
 */
export const updateApp = async (globalData: GlobalData): Promise<void> => {
  // 请求配置文件
  const onlineVersion = await requestJSON<string>(
    `d/config/${globalData.appID}/version`,
  );

  if (compareVersion(onlineVersion, globalData.version) > 0) {
    if (globalData.info.platform === "android")
      showModal(
        "App有新版本",
        `App 的最新版本是 ${onlineVersion}，点击确定以更新至最新版本。`,
        () => {
          // avoid downloading the same file
          if (apkFilePath) wx.miniapp.installApp({ filePath: apkFilePath });
          else
            downLoad(`${assets}innenu-v${onlineVersion}.apk`).then(
              (filePath) => {
                apkFilePath = filePath;
                wx.miniapp.installApp({ filePath });
              },
            );
        },
        () => {
          // do nothing
        },
      );

    // TODO: Complete iOS logic
  }
};
