import type { AppSettings, ServiceSettings } from "./settings.js";
import type { PageData } from "../../typings/index.js";

export interface PageState {
  /** 页面数据 */
  data?: PageData;
  /** 页面标识符 */
  id?: string;
}

export interface GlobalData {
  /** App 设置 */
  settings: Omit<AppSettings, "service" | "notice" | "update"> | null;
  /** App 服务 */
  service: ServiceSettings;

  /** 页面信息 */
  page: PageState;
}

/** 全局数据 */
export const globalData: GlobalData = {
  page: {
    data: {},
    id: "",
  },
  settings: null,
  service: wx.getStorageSync<ServiceSettings>("service") || {
    forceOnline: false,
  },
};
