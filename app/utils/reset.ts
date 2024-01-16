import { ls, rm } from "@mptool/all";

import { confirmAction, showModal } from "../api/index.js";
import { info } from "../state/info.js";

const { envName } = info;

export const resetApp = (): void => {
  confirmAction(`重置${envName}`, () => {
    // 显示提示
    wx.showLoading({ title: "重置中", mask: true });

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
        `${envName}重置完成`,
        `请单击 “退出${envName}按钮” 退出${envName}并重新进入。`,
      );
  });
};
