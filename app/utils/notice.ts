import { logger } from "@mptool/enhance";

import { type GlobalData } from "./app.js";
import { requestJSON } from "../api/net.js";
import { showModal } from "../api/ui.js";

/** 通知格式 */
export interface Notice {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 是否每次都通知 */
  force?: boolean;
}

/**
 * 弹窗通知检查
 *
 * @param globalData 小程序的全局数据
 */
export const updateNotice = (globalData: GlobalData): void => {
  requestJSON<Record<string, Notice>>(
    `r/config/${globalData.appID}/${globalData.version}/notice`,
  )
    .then((noticeList) => {
      for (const pageName in noticeList) {
        const notice = noticeList[pageName];
        const oldNotice = wx.getStorageSync<Notice | undefined>(
          `${pageName}-notice`,
        );

        // 如果通知内容不同或为强制通知，写入通知信息，并重置通知状态
        if (
          !oldNotice ||
          oldNotice.title !== notice.title ||
          oldNotice.content !== notice.content ||
          notice.force
        ) {
          wx.setStorageSync(`${pageName}-notice`, notice);
          wx.removeStorageSync(`${pageName}-notifyed`);
        }

        // 如果找到 APP 级通知，进行判断
        if (pageName === "app")
          if (!wx.getStorageSync("app-notifyed") || notice.force)
            showModal(notice.title, notice.content, () =>
              wx.setStorageSync("app-notifyed", true),
            );
      }
    })
    .catch(() => {
      // 调试信息
      logger.warn(`noticeList error`);
    });
};
