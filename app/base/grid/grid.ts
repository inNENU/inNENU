import type { PropType } from "@mptool/all";
import { $Component, readFile, showModal, writeClipboard } from "@mptool/all";

import type {
  GridComponentItemOptions,
  GridComponentOptions,
} from "../../../typings/index.js";
import { env } from "../../state/index.js";

$Component({
  props: {
    /** 网格组件配置 */
    config: {
      type: Object as PropType<GridComponentOptions>,
      required: true,
    },
  },

  methods: {
    // 设置图标
    setLogo(items?: GridComponentItemOptions[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map((item) =>
          item.icon && !item.icon.includes("/")
            ? readFile(`icon/${item.icon}`) || ""
            : "",
        ),
      });
    },

    tap({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { item: GridComponentItemOptions }
    >) {
      const { item } = currentTarget.dataset;

      if ("appId" in item) {
        if (env === "wx") {
          wx.navigateToMiniProgram({
            appId: item.appId,
            path: item.path,
            extraData: item.extraData,
            envVersion: item.versionType,
          });
        } else if (env === "app") {
          const { appId, path, versionType } = item;

          if (appId && path)
            wx.miniapp.launchMiniProgram({
              userName: appId,
              path,
              miniprogramType:
                versionType === "develop" ? 1 : versionType === "trial" ? 2 : 0,
            });
          else {
            showModal("无法打开", "暂不支持打开微信小程序短链");
          }
        } else {
          showModal("无法打开", "暂不支持打开微信小程序");
        }
      } else if (item.url) {
        // 页面路径
        if (!/^https?:\/\//.test(item.url)) this.$go(item.url);
        // 为链接
        else {
          // 打开浏览器或 App
          if (env === "app") wx.miniapp.openUrl({ url: item.url });
          // 判断是否是可以跳转的微信图文
          else if (
            env === "wx" &&
            item.url.startsWith("https://mp.weixin.qq.com") &&
            wx.openOfficialAccountArticle
          ) {
            wx.openOfficialAccountArticle({ url: item.url });
          }
          // 无法跳转，复制链接到剪切板
          else
            writeClipboard(item.url).then(() => {
              showModal(
                "无法直接打开",
                "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
              );
            });
        }
      }
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
    },
    attached() {
      this.$on("inited", this.setLogo);
    },
    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: GridComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },

  // NOTE: For QQ Only
  options: {
    styleIsolation: "shared",
  },
});
