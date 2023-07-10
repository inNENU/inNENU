import { downLoad } from "./net.js";
import { showModal } from "./ui.js";

/**
 * 保存图片到相册
 *
 * @param imgPath 图片地址
 */
export const savePhoto = (imgPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    downLoad(imgPath)
      .then((path) => {
        // 获取用户设置
        wx.getSetting({
          success: ({ authSetting }) => {
            // 如果已经授权相册直接写入图片
            if (authSetting["scope.writePhotosAlbum"])
              wx.saveImageToPhotosAlbum({
                filePath: path,
                success: () => resolve(),
              });
            // 没有授权 —> 提示用户授权
            else
              wx.authorize({
                scope: "scope.writePhotosAlbum",
                success: () => {
                  wx.saveImageToPhotosAlbum({
                    filePath: path,
                    success: () => resolve(),
                  });
                },

                // 用户拒绝权限，提示用户开启权限
                fail: () => {
                  showModal(
                    "权限被拒",
                    "如果想要保存图片，请在“权限设置”允许保存图片权限",
                    () => {
                      wx.openSetting({
                        success: () => reject(),
                      });
                    },
                  );
                },
              });
          },
        });
      })
      .catch(() => reject());
  });
