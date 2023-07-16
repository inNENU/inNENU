import type { GlobalData } from "./app.js";
import { compareVersion } from "./version.js";
import { requestJSON, showModal } from "../api/index.js";
import { assets } from "../config/index.js";

/**
 * 检查小程序更新
 *
 * 如果检测到小程序更新，获取升级状态 (新版本号，是否立即更新、是否重置小程序) 并做相应处理
 *
 * @param globalData 小程序的全局数据
 */
export const updateApp = async (globalData: GlobalData): Promise<void> => {
  // 请求配置文件
  const onlineVersion = await requestJSON<string>(
    `r/config/${globalData.appID}/version`,
  );

  if (compareVersion(onlineVersion, globalData.version))
    showModal(
      "App有新版本",
      `App 的最新版本是 ${onlineVersion}，点击确定复制下载链接到剪切板。请手动粘贴到浏览器开启下载。`,
      () => {
        wx.setClipboardData({
          data: `${assets}innenu-v${onlineVersion}.apk`,
        });
      },
      () => {
        // do nothing
      },
    );
};
