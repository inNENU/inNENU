/**
 * 根据用户设置，判断当前小程序是否应启用夜间模式
 *
 * @returns 夜间模式状态
 */
export const getDarkmode = (
  sysInfo: WechatMiniprogram.SystemInfo = wx.getSystemInfoSync()
): boolean => (sysInfo.AppPlatform ? false : sysInfo.theme === "dark");

export const getWindowInfo = (): WechatMiniprogram.WindowInfo =>
  /** @desc >2.20.1 */
  wx.getWindowInfo?.() || wx.getSystemInfoSync();

/**
 * 显示提示窗口
 *
 * @param title 提示文字
 * @param content 提示文字
 * @param confirmFunc 点击确定的回调函数
 * @param cancelFunc 点击取消的回调函数，不填则不显示取消按钮
 */
export const showModal = (
  title: string,
  content: string,
  confirmFunc?: () => void,
  cancelFunc?: () => void
): void => {
  /** 显示取消按钮 */
  const showCancel = Boolean(cancelFunc);

  wx.showModal({
    title,
    content,
    showCancel,
    success: ({ cancel, confirm }) => {
      if (confirm && confirmFunc) confirmFunc();
      else if (cancel && cancelFunc) cancelFunc();
    },
  });
};

/**
 * 显示提示文字
 *
 * @param text 提示文字
 * @param duration 提示持续时间，单位 ms，默认为 `1500`
 * @param icon 提示图标，默认为 `'none'`
 */
export const showToast = (
  text: string,
  duration = 1500,
  icon: "success" | "loading" | "none" = "none"
): void => {
  wx.showToast({ icon, title: text, duration });
};

/**
 * 确认操作
 *
 * @param actionText 行为文字
 * @param confirmFunc 确定回调函数
 * @param cancelFunc 取消回调函数
 */
export const confirmAction = (
  actionText: string,
  confirmFunc: () => void,
  cancelFunc: () => void = (): void => void 0
): void => {
  showModal("确认操作", `您确定要${actionText}么?`, confirmFunc, cancelFunc);
};
