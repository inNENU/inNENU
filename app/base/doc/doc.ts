import { $Component, type PropType } from "@mptool/enhance";

import { type DocComponentOptions } from "../../../typings/index.js";
import { savePhoto } from "../../api/media.js";
import { downLoad } from "../../api/net.js";
import { showModal, showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";

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
      if (["doc", "ppt", "xls", "pdf"].includes(icon))
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
      else if (["jpg", "png", "gif"].includes(icon))
        // 检测到图片，开始图片浏览
        wx.previewImage({ urls: [url] });
    },

    /** 下载文档 */
    download(): void {
      const { icon, url } = this.data.config;

      if (["doc", "ppt", "xls", "pdf"].includes(icon))
        wx.setClipboardData({
          data: url,
          success: () => {
            showModal(
              "复制成功",
              `下载链接已复制到您的剪切板。受${globalData.envName}限制，请您自行打开浏览器粘贴在地址栏中以开启下载。`
            );
          },
        });
      else if (["jpg", "png", "gif"].includes(icon))
        // 检测到图片，开始图片下载
        savePhoto(url).then(() => showToast("已保存至相册"));
    },
  },
});
