import { downLoad } from "./net.js";
import { showModal, showToast } from "./ui.js";

export const openDocument = (url: string): void => {
  downLoad(url)
    .then((filePath) => {
      wx.openDocument({
        filePath,
        showMenu: true,
        success: () => {
          console.log(`Open document ${filePath} success`);
        },
        fail: ({ errMsg }) => {
          console.log(`Open document ${filePath} failed: ${errMsg}`);
        },
      });
    })
    .catch(() => {
      showToast("下载文档失败");

      wx.reportEvent?.("resource_load_failed", {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        broken_url: url,
      });
    });
};

export const saveDocument = (
  url: string,
  filename = /\/([^/]+)\.[^/]+?$/.exec(url)?.[1] ?? "document",
): void => {
  // 首选添加到收藏
  if (wx.canIUse("addFileToFavorites"))
    downLoad(url)
      .then((filePath) => {
        const docType = url.split(".").pop()!;

        wx.addFileToFavorites({
          fileName: `${filename}.${docType}`,
          filePath,
          success: () => {
            showModal("文件已保存", "文件已保存至“微信收藏”");
            console.log(`Add document ${url} to favorites success`);
          },
          fail: ({ errMsg }) => {
            console.log(`Add document ${url} to favorites failed: ${errMsg}`);
          },
        });
      })
      .catch(() => {
        showToast("下载文档失败");
        wx.reportEvent?.("resource_load_failed", {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          broken_url: url,
        });
      });
};
