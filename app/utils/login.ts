import { request } from "../api/index.js";
import { appID, env, user } from "../state/index.js";

export interface LoginInfo {
  openid: string;
  isAdmin: boolean;
  inBlacklist: boolean;
}

const mpLogin = (code?: string): Promise<LoginInfo> =>
  request<LoginInfo>("/mp/login", {
    method: "POST",
    body: code ? { appID, code, env } : { openid: user.openid },
  }).then(({ data }) => data);

/**
 * 登录
 */
export const login = (callback: (result: LoginInfo) => void): void => {
  if (user.openid) mpLogin().then(callback);
  else if (env === "qq" || env === "wx") {
    wx.login({
      success: ({ code }) => {
        mpLogin(code).then(callback);
      },
      fail: ({ errMsg }) => {
        console.error(`Login failed: ${errMsg}`);
      },
    });
  }
};
