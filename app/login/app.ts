import { request } from "../api/net.js";
import { service } from "../config/index.js";
import type { AppID, Env } from "../utils/app.js";

interface LoginCallback {
  openid: string;
}

/**
 * 登录
 *
 * @param appID 小程序的appID
 */
export const login = (
  appID: AppID,
  env: Env,
  callback: (openid: string) => void,
): void => {
  const openid = wx.getStorageSync<string | undefined>("openid");

  if (openid) {
    console.info(`User OPENID: ${openid}`);
    callback(openid);
  } else if (env === "qq" || env === "wx") {
    wx.login({
      success: async ({ code }) => {
        if (code) {
          const data = await request<LoginCallback>(`${service}mp/login`, {
            method: "POST",
            data: { appID, code, env },
          });

          wx.setStorageSync("openid", data.openid);
          console.info(`User OPENID: ${data.openid}`);
          callback(data.openid);
        }
      },
      fail: ({ errMsg }) => {
        console.error(`Login failed: ${errMsg}`);
      },
    });
  }
};
