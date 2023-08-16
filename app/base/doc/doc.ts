import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { DocComponentOptions } from "../../../typings/index.js";
import {
  downLoad,
  savePhoto,
  setClipboard,
  showModal,
  showToast,
} from "../../api/index.js";
import type { AppOption } from "../../app.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    /** 配置 */
    config: {
      type: Object as PropType<DocComponentOptions>,
      required: true,
    },
  },

  methods: {
    view(): void {
      const { icon, url } = this.data.config;

      // 检测到文档
      if (["doc", "ppt", "xls", "pdf"].includes(icon)) {
        // compatible with pc wechat and qq
        if (wx.canIUse("openDocument"))
          downLoad(url)
            .then((filePath) => {
              wx.openDocument({
                filePath,
                showMenu: true,
                success: () => {
                  console.log(`Open document ${url} success`);
                },
                fail: ({ errMsg }) => {
                  console.log(`Open document ${url} failed: ${errMsg}`);
                },
              });
            })
            .catch(() => {
              showToast(`下载文档失败`);
              wx.reportEvent?.("resource_load_failed", {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                broken_url: url,
              });
            });
        else this.download();
      } else if (["jpg", "png", "gif"].includes(icon))
        // 检测到图片，开始图片浏览
        wx.previewImage({ urls: [url] });
    },

    /** 下载文档 */
    download(): void {
      const { icon, name, url } = this.data.config;

      if (["doc", "ppt", "xls", "pdf"].includes(icon)) {
        // compatible with pc wechat and qq
        if (wx.canIUse("addFileToFavorites"))
          downLoad(url)
            .then((filePath) => {
              const docType = url.split(".").pop()!;

              wx.addFileToFavorites({
                fileName: `${name}.${docType}`,
                filePath,
                success: () => {
                  console.log(`Add document ${url} to favorites success`);
                  showModal("文件已保存", "文件已保存至“微信收藏”");
                },
                fail: ({ errMsg }) => {
                  console.log(
                    `Add document ${url} to favorites failed: ${errMsg}`,
                  );
                },
              });
            })
            .catch(() => {
              showToast(`下载文档失败`);
              wx.reportEvent?.("resource_load_failed", {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                broken_url: url,
              });
            });
        else
          setClipboard(url).then(() => {
            showModal(
              "复制成功",
              `下载链接已复制到您的剪切板。受${globalData.envName}限制，请您自行打开浏览器粘贴在地址栏中以下载。`,
            );
          });
      } else if (["jpg", "png", "gif"].includes(icon))
        // 检测到图片，开始图片下载
        savePhoto(url).then(() => showToast("已保存至相册"));
    },
  },
});
