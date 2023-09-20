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
  "main-presets": Record<string, ComponentConfig[]>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "function-presets": Record<string, ComponentConfig[]>;
  user: ComponentConfig[];
  about: ComponentConfig[];
  notice: NoticeSettings;
  service: ServiceSettings;
  update: UpdateSettings;
}

export interface Identify {
  id: string;
  type: "under" | "post" | null;
  location: "benbu" | "jingyue" | null;
}

export const getIdentity = (userInfo: UserInfo | null): Identify => {
  if (userInfo === null)
    return {
      id: "unlogin",
      type: null,
      location: null,
    };

  const { grade, typeId, location } = userInfo;

  return {
    id: grade.toString(),
    type: typeId === "bks" ? "under" : typeId === "yjs" ? "post" : null,
    location: location === "unknown" ? null : location,
  };
};

export const fetchData = async (
  globalData: GlobalData,
  isTest = false,
): Promise<void> => {
  try {
    const { appID, version } = globalData;
    const { service, notice, ...data } = await request<Data>(
      `${server}service/settings.php`,
      {
        method: "POST",
        data: {
          appID,
          version: isTest ? "test" : version,
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
