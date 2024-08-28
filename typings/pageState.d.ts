import type { ComponentConfig } from "./components.js";
import type { PageData } from "../server/typings/index.js";

/** 页面选项 */
export interface PageOptions {
  id?: string;
  scene?: string;
  from?: string;
  path?: string;
  action?: string;
}

/** 页面状态 */
export interface PageState extends Partial<PageData> {
  /** 状态栏高度 */
  statusBarHeight?: number;
  /** 页面深度 */
  depth?: number;
  /** 页面来源 */
  from?: string;
  /** 是否加载失败 */
  error?: true;
  /** 左上角操作 */
  action?: string | boolean;

  /** 是否显示标题(仅 iOS 主题) */
  titleDisplay?: boolean;
  /** 是否显示分割线(仅 iOS 主题) */
  borderDisplay?: boolean;
  /** 是否显示阴影(仅 Android 主题) */
  shadow?: boolean;
  image?: string[];
  content?: ComponentConfig[];
  scopeData?: WechatMiniprogram.GeneralScopeData;
}

/** 含有内容的页面状态 */
export interface PageStateWithContent extends PageState {
  content: ComponentConfig[];
}
