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
  /** 用户年级 */
  grade: number;
  /** 用户层次代码 */
  type: "bks" | "yjs" | "lxs" | "jzg";
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

interface Identity {
  id: string;
  type: "under" | "post" | null;
}

export const getIdentity = (): Identity => {
  if (userState.info === null)
    return {
      id: "unlogin",
      type: null,
    };

  const { grade, type } = userState.info;

  return {
    id: grade.toString(),
    type: type === "bks" ? "under" : type === "yjs" ? "post" : null,
  };
};

export const clearUserInfo = (): void => {
  userState.account = null;
  userState.info = null;
  remove(ACCOUNT_INFO_KEY);
  remove(USER_INFO_KEY);
};
