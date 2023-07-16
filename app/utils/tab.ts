import { type PageData } from "../../typings/index.js";
import { requestJSON } from "../api/index.js";
import { type AppOption } from "../app.js";

const { globalData } = getApp<AppOption>();

/**
 * 刷新 tab 页
 *
 * @param name 页面名称
 * @param ctx 页面指针
 * @param globalData 全局数据
 */
export const refreshPage = async (name: string): Promise<PageData> => {
  const test = wx.getStorageSync<boolean | undefined>("test");

  const data = await requestJSON<PageData>(
    `r/config/${globalData.appID}/${
      test ? "test" : globalData.version
    }/${name}`,
  );

  // 测试页面不存储
  if (!test) wx.setStorageSync(name, data);

  return data;
};
