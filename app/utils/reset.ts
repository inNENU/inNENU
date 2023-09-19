import { ls, rm } from "@mptool/all";

import { confirmAction, showModal } from "../api/index.js";
import type { AppOption } from "../app.js";

const { globalData } = getApp<AppOption>();
const { envName } = globalData;

export const resetApp = (): void => {
  confirmAction(`初始化${envName}`, () => {
    // 显示提示
    wx.showLoading({ title: "初始化中", mask: true });

    // 清除文件系统文件与数据存储
    ls("").forEach((filePath) => rm(filePath));
    wx.clearStorageSync();

    // 隐藏提示
    wx.hideLoading();
    if (wx.restartMiniProgram)
      wx.restartMiniProgram({ path: "/pages/main/main" });
    // 提示用户重启
    else
      showModal(
        `${envName}初始化完成`,
        `请单击 “退出${envName}按钮” 退出${envName}。`,
      );
  });
};
