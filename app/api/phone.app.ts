/**
 * 保存联系人到通讯录
 *
 * @param config 联系人信息
 */
export const addPhoneContact = (
  config: Omit<
    WechatMiniprogram.AddPhoneContactOption,
    "success" | "fail" | "complete"
  >
): Promise<void> =>
  new Promise((resolve) => {
    wx.addPhoneContact({
      ...config,
      success: () => resolve(),
    });
  });
