import { get, remove, set } from "@mptool/all";

import { MONTH } from "../config/index.js";

const ACCOUNT_INFO_KEY = "nenu-account-info-v4";

const USER_INFO_KEY = "nenu-user-info-v4";

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

export interface UserState {
  /** 账号信息 */
  account: AccountInfo | null;
  /** 用户 OPENID */
  openid: string | null;
  /** 用户信息 */
  info: UserInfo | null;
}

const OPEN_ID_KEY = "openid";

const userState: UserState = {
  account: get<AccountInfo | undefined>(ACCOUNT_INFO_KEY) || null,
  openid: wx.getStorageSync<string | undefined>(OPEN_ID_KEY) || null,
  info: get<UserInfo | undefined>(USER_INFO_KEY) || null,
};

export const user: Readonly<UserState> = userState;

export const setUserInfo = (account: AccountInfo, info: UserInfo): void => {
  userState.account = account;
  set(ACCOUNT_INFO_KEY, account, MONTH);
  userState.info = info;
  set(USER_INFO_KEY, info, MONTH);
};

export const setOpenid = (openid: string | null): void => {
  userState.openid = openid;
  wx.setStorageSync(OPEN_ID_KEY, openid);
};

export interface Identify {
  id: string;
  type: "under" | "grad" | null;
  location: "benbu" | "jingyue" | null;
}

export const getIdentity = (): Identify => {
  if (userState.info === null)
    return {
      id: "guest",
      type: null,
      location: null,
    };

  const { grade, typeId, location } = userState.info;

  return {
    id: grade.toString(),
    type: typeId === "bks" ? "under" : typeId === "yjs" ? "grad" : null,
    location: location === "unknown" ? null : location,
  };
};

export const clearUserInfo = (): void => {
  userState.account = null;
  userState.info = null;
  remove(ACCOUNT_INFO_KEY);
  remove(USER_INFO_KEY);
};
