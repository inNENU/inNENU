import { request } from "./net.js";
import { server } from "../config/info.js";
import { type AppID, type Env } from "../utils/app.js";

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
      success: ({ code }) => {
        if (code)
          request<LoginCallback>(`${server}service/login.php`, {
            method: "POST",
            data: { appID, code, env },
          }).then((data) => {
            wx.setStorageSync("openid", data.openid);
            console.info(`User OPENID: ${data.openid}`);
            callback(data.openid);
          });
      },
      fail: ({ errMsg }) => {
        console.error(`Login failed: ${errMsg}`);
      },
    });
  }
};
