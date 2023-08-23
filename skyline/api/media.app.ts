import { downLoad } from "./net.js";

/**
 * 保存图片到相册
 *
 * @param imgPath 图片地址
 */
export const savePhoto = (imgPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    downLoad(imgPath)
      .then((path) => {
        wx.saveImageToPhotosAlbum({
          filePath: path,
          success: () => resolve(),
        });
      })
      .catch(() => reject());
  });
