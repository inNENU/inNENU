import type { Data, ServiceSettings } from "./settings.ts";
import type { PageData } from "../../typings/index.js";

export type AppID =
  | "wx33acb831ee1831a5"
  | "wx9ce37d9662499df3"
  | "wx69e79c3d87753512"
  | 1109559721;
export type Env = "app" | "qq" | "wx" | "web";

export interface AccountInfo {
  /** 学号 */
  id: number;
  /** 密码 */
  password: string;
}

export interface UserInfo {
  /** 用户学号 */
  id: number;
  /** 用户姓名 */
  name: string;
  /** 用户身份证号 */
  idCard: string;
  /** 用户所在组织名称 */
  org: string;
  /** 用户所在组织 ID */
  orgId: number;
  /** 用户所在专业名称 */
  major: string;
  /** 用户所在专业 ID */
  majorId: string;
  /** 用户入学年份 */
  inYear: number;
  /** 用户入学年级 */
  grade: number;
  /** 用户层次 */
  type: string;
  /** 用户层次代码 */
  typeId: string;
  /** 用户类别码 */
  code: string;
  /** 用户政治面貌 */
  politicalStatus: string;
  /** 用户民族 */
  people: string;
  /** 用户民族代码 */
  peopleId: number;
  /** 用户性别 */
  gender: string;
  /** 用户性别代码 */
  genderId: number;
  /** 用户出生日期 */
  birth: string;
}

export interface MusicState {
  /** 是否正在播放 */
  playing: boolean;
  /** 播放歌曲序号 */
  index: number;
}

export interface PageState {
  /** 页面数据 */
  data?: PageData;
  /** 页面标识符 */
  id?: string;
}

export interface GlobalData {
  /** 运行环境 */
  env: Env;
  /** 运行环境名称 */
  envName: string;
  /** 版本号 */
  version: string;
  /** 账号信息 */
  account: AccountInfo | null;
  userInfo: UserInfo | null;
  /** 播放器信息 */
  music: MusicState;
  /** 页面信息 */
  page: PageState;
  /** 启动时间 */
  startupTime: number;
  /** 正在应用的主题 */
  theme: string;
  /** 夜间模式开启状态 */
  darkmode: boolean;
  /** 设备信息 */
  info: WechatMiniprogram.SystemInfo;
  /** 小程序 appid */
  appID: AppID;
  /** 用户 OPENID */
  openid: string;
  /** 是否能复制 */
  selectable: boolean;
  data: Omit<Data, "service" | "notice" | "update"> | null;
  service: ServiceSettings;
}
