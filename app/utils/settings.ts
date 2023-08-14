import { logger } from "@mptool/all";

import { updateNotice } from "./notice.js";
import type { GlobalData, UserInfo } from "./typings.js";
import type { ComponentConfig } from "../../typings/components.js";
import { request } from "../api/index.js";
import { server } from "../config/info.js";

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

export interface Data {
  "main-page": Record<string, string>;
  "intro-page": Record<
    string,
    {
      items: string[];
      more: string[];
    }
  >;
  "guide-page": Record<
    string,
    {
      items: string[];
      more: string[];
    }
  >;
  "function-page": Record<string, string>;
  "main-presets": Record<string, ComponentConfig[]>;
  "function-presets": Record<string, ComponentConfig[]>;
  user: ComponentConfig[];
  about: ComponentConfig[];
  notice: NoticeSettings;
  service: ServiceSettings;
  update: UpdateSettings;
}

export const getIdentity = (userInfo: UserInfo | null): string =>
  userInfo ? userInfo.grade.toString() : "unlogin";

export const fetchData = async (globalData: GlobalData): Promise<void> => {
  try {
    const { service, notice, ...data } = await request<Data>(
      `${server}service/settings.php`,
      {
        method: "POST",
        data: {
          version: globalData.version,
          appID: globalData.appID,
        },
      },
    );

    globalData.data = data;
    globalData.service = service;
    wx.setStorageSync("service", service);
    updateNotice(notice);
  } catch (err) {
    // 调试信息
    logger.warn(`Fetch settings failed`);
  }
};
