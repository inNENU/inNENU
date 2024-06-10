import type { GlobalData } from "./globalData.js";
import { platformActions } from "./platform.js";
import { updateApp } from "./update.js";
import { getCurrentRoute, showToast } from "../api/index.js";
import { env, envName, setOpenid } from "../state/index.js";
import { login } from "../utils/index.js";

/** 注册全局监听 */
const registerActions = (): void => {
  const debug = wx.getStorageSync<boolean | undefined>("debugMode") || false;

  // 设置调试
  wx.setEnableDebug({ enableDebug: debug });
  (wx.env as Record<string, unknown>).DEBUG = debug;

  // 获取网络信息
  wx.getNetworkType({
    success: ({ networkType }) => {
      if (networkType === "none") showToast("没有网络连接");
    },
  });

  // 设置内存不足警告
  wx.onMemoryWarning((res) => {
    console.warn("Memory warning received.");
    wx.reportEvent?.("memory_warning", {
      level: res?.level || 0,
    });
  });

  // 监听网络状态
  wx.onNetworkStatusChange(({ isConnected }) => {
    // 显示提示
    if (!isConnected) {
      showToast(`网络连接中断,部分${envName}功能暂不可用`);
      wx.setStorageSync("networkError", true);
    } else if (wx.getStorageSync("network")) {
      wx.setStorageSync("networkError", false);
      showToast("网络连接恢复");
    }
  });

  // 监听用户截屏
  if (
    ["wx", "qq"].includes(env) &&
    wx.getStorageSync("capture-screen") !== "never"
  ) {
    // avoid duplicate modal on QQ
    let isDisplayingModal = false;

    wx.onUserCaptureScreen?.(() => {
      const status = wx.getStorageSync<"never" | "noticed" | undefined>(
        "capture-screen",
      );

      if (status !== "never" && !isDisplayingModal) {
        isDisplayingModal = true;
        wx.showModal({
          title: `善用${envName}分享`,
          content: `您可以点击右上角选择分享到好友、分享到朋友圈/空间\n您也可以点击页面右下角的分享图标，选择保存${envName}二维码并分享`,
          showCancel: status === "noticed",
          cancelText: "不再提示",
          theme: "day",
          success: ({ cancel, confirm }) => {
            if (confirm) {
              wx.setStorageSync("capture-screen", "noticed");
            } else if (cancel) {
              wx.setStorageSync("capture-screen", "never");
              if (wx.canIUse("offUserCaptureScreen")) wx.offUserCaptureScreen();
            }

            isDisplayingModal = false;
          },
        });
      }
    });
  }
};

/**
 * 小程序启动时的运行函数
 *
 * 负责检查通知与小程序更新，注册网络、内存、截屏的监听
 *
 * @param globalData 小程序的全局数据
 */
export const startup = (globalData: GlobalData): void => {
  registerActions();
  login(({ openid, inBlacklist }) => {
    setOpenid(openid);
    if (inBlacklist && getCurrentRoute() !== "pages/action/action")
      wx.reLaunch({ url: "/pages/action/action?action=blacklist" });
  });
  platformActions(globalData);
  updateApp();
};
