import { showModal } from "@mptool/all";

export interface NoticeItem {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 是否每次都通知 */
  force?: boolean;
}

export type NoticeSettings = Record<string, NoticeItem>;

/**
 * 同步通知信息
 *
 * @param noticeSettings 通知设置
 */
export const syncNotice = (noticeSettings: NoticeSettings): void => {
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
      wx.removeStorageSync(`${pageName}-notified`);
    }

    // 如果找到 APP 级通知，进行判断
    if (pageName === "app")
      if (!wx.getStorageSync("app-notified") || force)
        showModal(title, content, () =>
          wx.setStorageSync("app-notified", true),
        );
  });
};
