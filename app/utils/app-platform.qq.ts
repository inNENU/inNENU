import { type GlobalData } from "./app.js";
import { showModal } from "../api/index.js";

const checkGroupApp = (): void => {
  const { entryDataHash } = wx.getLaunchOptionsSync();

  if (entryDataHash)
    wx.getGroupInfo({
      entryDataHash,
      success: ({ isGroupManager }) => {
        if (isGroupManager)
          wx.getGroupAppStatus({
            entryDataHash,
            success: ({ isExisted }) => {
              if (!isExisted)
                showModal("尊敬的管理员", "请考虑添加小程序到群应用!", () => {
                  wx.navigateTo({
                    url: "/pages/action/action?action=addGroupApp",
                  });
                });
            },
          });
      },
    });
};

export const platformActions = (globalData: GlobalData): void => {
  globalData;
  checkGroupApp();
};
