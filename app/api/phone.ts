import { showModal } from "./ui.js";

/**
 * 保存联系人到通讯录
 *
 * @param config 联系人信息
 */
export const addPhoneContact = (
  config: Omit<
    WechatMiniprogram.AddPhoneContactOption,
    "success" | "fail" | "complete"
  >,
  force = false
): Promise<void> =>
  new Promise((resolve, reject) => {
    const addPhoneContact = (): void =>
      wx.addPhoneContact({
        ...config,
        success: () => resolve(),
      });

    if (force) addPhoneContact();
    // 获取用户设置
    else
      wx.getSetting({
        success: ({ authSetting }) => {
          // 如果已经授权直接写入联系人
          if (authSetting["scope.addPhoneContact"]) addPhoneContact();
          // 没有授权 —> 提示用户授权
          else
            wx.authorize({
              scope: "scope.addPhoneContact",
              success: () => {
                wx.addPhoneContact({
                  ...config,
                  success: () => resolve(),
                });
              },

              // 用户拒绝权限，提示用户开启权限
              fail: () => {
                showModal(
                  "权限被拒",
                  "如果想要保存联系人，请在“权限设置”允许添加到联系人权限",
                  () => {
                    wx.openSetting({
                      success: () => reject(),
                    });
                  }
                );
              },
            });
        },
      });
  });
