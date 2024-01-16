import type { AppSettings, ServiceSettings } from "./settings.ts";
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
