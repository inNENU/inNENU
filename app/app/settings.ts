import { logger } from "@mptool/all";

import type { GlobalData } from "./globalData.js";
import type { NoticeSettings } from "./notice.js";
import { syncNotice } from "./notice.js";
import type { ComponentData } from "../../typings/components.js";
import { request } from "../api/index.js";
import { server, version } from "../config/index.js";
import { appId } from "../state/index.js";

export type ServiceStatus = "local" | "online";

export type ServiceSettings = { forceOnline?: boolean } & Record<
  string,
  ServiceStatus
>;

export interface AppUpdateSettings {
  /** 是否进行强制更新 */
  force: boolean;
  /** 是否进行强制初始化 */
  reset: boolean;
}

export interface AppSettings {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "main-page": Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "intro-page": Record<
    string,
    {
      items: string[];
      more: string[];
    }
  >;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "guide-page": Record<
    string,
    {
      items: string[];
      more: string[];
    }
  >;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "function-page": Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "main-presets": Record<string, ComponentData[]>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "function-presets": Record<string, ComponentData[]>;
  user: ComponentData[];
  about: ComponentData[];
  notice: NoticeSettings;
  service: ServiceSettings;
  update: AppUpdateSettings;
}

export const syncAppSettings = async (
  globalData: GlobalData,
  isTest = false,
): Promise<void> => {
  try {
    const {
      data: { service, notice, ...data },
    } = await request<AppSettings>(`${server}service/settings.php`, {
      method: "POST",
      body: {
        appId,
        version: isTest ? "test" : version,
      },
    });

    globalData.settings = data;
    globalData.service = service;
    wx.setStorageSync("service", service);
    syncNotice(notice);
  } catch (err) {
    // 调试信息
    logger.error("应用配置获取失败", err);
  }
};
