import { logger } from "@mptool/all";

import type { GlobalData } from "./app.js";
import { updateNotice } from "./notice.js";
import { requestJSON } from "../api/index.js";

export interface Notice {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 是否每次都通知 */
  force?: boolean;
}

export type NoticeSettings = Record<string, Notice>;

export type ServiceStatus = "local" | "online";

export type ServiceSettings = { forceOnline?: boolean } & Record<
  string,
  ServiceStatus
>;

export interface UpdateSettings {
  /** 是否进行强制更新 */
  force: boolean;
  /** 是否进行强制初始化 */
  reset: boolean;
}

export interface Settings {
  notice: NoticeSettings;
  service: ServiceSettings;
  update: UpdateSettings;
}

export const updateSettings = async (globalData: GlobalData): Promise<void> => {
  try {
    const { service, notice } = await requestJSON<Settings>(
      `r/config/${globalData.appID}/${globalData.version}/settings`,
    );

    globalData.service = service;
    wx.setStorageSync("service", service);
    updateNotice(notice);
  } catch (err) {
    // 调试信息
    logger.warn(`Fetch settings failed`);
  }
};
