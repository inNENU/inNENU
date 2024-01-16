import type { AppSettings, ServiceSettings } from "./settings.ts";
import type { PageData } from "../../typings/index.js";

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
  typeId: "bks" | "yjs" | "lxs" | "jzg";
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
  /** 用户所在校区 */
  location: "benbu" | "jingyue" | "unknown";
}

export interface PageState {
  /** 页面数据 */
  data?: PageData;
  /** 页面标识符 */
  id?: string;
}

export interface GlobalData {
  /** 账号信息 */
  account: AccountInfo | null;
  /** 用户 OPENID */
  openid: string;
  /** 用户信息 */
  userInfo: UserInfo | null;
  /** App 设置 */
  settings: Omit<AppSettings, "service" | "notice" | "update"> | null;
  /** App 服务 */
  service: ServiceSettings;

  /** 页面信息 */
  page: PageState;
}
