import type { PropType } from "@mptool/all";
import {
  $Component,
  openDocument,
  saveDocument,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type { DocComponentOptions } from "../../../typings/index.js";
import { envName } from "../../state/index.js";
import { getAssetLink } from "../../utils/getPath.js";

const DOC_ICONS = ["doc", "ppt", "xls", "pdf"];
const IMAGE_ICONS = ["jpg", "png", "gif"];

$Component({
  props: {
    /** 配置 */
    config: {
      type: Object as PropType<DocComponentOptions>,
      required: true,
    },
  },

  methods: {
    view(): void {
      const { icon, url } = this.data.config;
      const link = getAssetLink(url);

      // 检测到文档
      if (DOC_ICONS.includes(icon)) {
        // compatible with pc wechat and qq
        if (wx.canIUse("openDocument")) openDocument(link);
        else this.download();
      } else if (IMAGE_ICONS.includes(icon))
        // 检测到图片，开始图片浏览
        wx.previewImage({ urls: [link] });
    },

    /** 下载文档 */
    download(): void {
      const { icon, name, url } = this.data.config;
      const link = getAssetLink(url);

      if (DOC_ICONS.includes(icon)) {
        // 首选添加到收藏
        if (wx.canIUse("addFileToFavorites")) saveDocument(link, name);
        // 将链接复制到剪切板
        else
          writeClipboard(link).then(() => {
            showModal(
              "复制成功",
              `下载链接已复制到您的剪切板。受${envName}限制，请您自行打开浏览器粘贴在地址栏中以下载。`,
            );
          });
      }
      // 保存图片至相册
      else if (IMAGE_ICONS.includes(icon))
        savePhoto(link).then(() => showToast("已保存至相册"));
    },
  },
});
