import { confirm, ls, rm, showModal } from "@mptool/all";

import { envName } from "../../../state/index.js";

export const resetApp = (): void => {
  confirm(`重置${envName}`, "", () => {
    // 显示提示
    wx.showLoading({ title: "重置中", mask: true });

    // 清除文件系统文件与数据存储
    ls("").forEach((filePath) => rm(filePath));
    wx.clearStorageSync();

    // 隐藏提示
    wx.hideLoading();

    // 重启小程序
    if (wx.restartMiniProgram)
      // 重启小程序
      wx.restartMiniProgram({ path: "/pages/main/main" });
    // 提示用户重启
    else
      showModal(
        `${envName}重置完成`,
        `请单击 “退出${envName}按钮” 退出${envName}并重新进入。`,
      );
  });
};
