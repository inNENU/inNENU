import { requestJSON } from "./api";
import { type PageData } from "../../typings";
import { type AppOption } from "../app";

const { globalData } = getApp<AppOption>();

/**
 * 刷新 tab 页
 *
 * @param name 页面名称
 * @param ctx 页面指针
 * @param globalData 全局数据
 */
export const refreshPage = (name: string): Promise<PageData> => {
  const test = wx.getStorageSync<boolean | undefined>("test");

  return requestJSON<PageData>(
    `r/config/${globalData.appID}/${test ? "test" : globalData.version}/${name}`
  ).then((data) => {
    // 测试页面不存储
    if (!test) wx.setStorageSync(name, data);

    return data;
  });
};
