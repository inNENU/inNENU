import type { AppSettings, ServiceSettings } from "./settings.js";
import type { PageState } from "../../typings/index.js";

export interface PageInfo {
  /** 页面数据 */
  data?: PageState;
  /** 页面标识符 */
  id?: string;
}

export interface GlobalData {
  /** App 设置 */
  settings: Omit<AppSettings, "service" | "notice" | "update"> | null;
  /** App 服务 */
  service: ServiceSettings;

  /** 页面信息 */
  page: PageInfo;
}

/** 全局数据 */
export const globalData: GlobalData = {
  page: {
    data: {},
    id: "",
  },
  settings: null,
  service: wx.getStorageSync<ServiceSettings>("service") || {},
};
