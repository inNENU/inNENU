import type { NoticeItem, NoticeSettings } from "./settings.js";
import { showModal } from "../api/index.js";

/**
 * 弹窗通知检查
 *
 * @param noticeSettings 通知设置
 */
export const updateNotice = (noticeSettings: NoticeSettings): void => {
  Object.entries(noticeSettings).forEach(([pageName, notice]) => {
    const { title, content, force } = notice;
    const oldNotice = wx.getStorageSync<NoticeItem | undefined>(
      `${pageName}-notice`,
    );

    // 如果通知内容不同或为强制通知，写入通知信息，并重置通知状态
    if (
      !oldNotice ||
      oldNotice.title !== title ||
      oldNotice.content !== content ||
      force
    ) {
      wx.setStorageSync(`${pageName}-notice`, notice);
      wx.removeStorageSync(`${pageName}-notifyed`);
    }

    // 如果找到 APP 级通知，进行判断
    if (pageName === "app")
      if (!wx.getStorageSync("app-notifyed") || force)
        showModal(title, content, () =>
          wx.setStorageSync("app-notifyed", true),
        );
  });
};
