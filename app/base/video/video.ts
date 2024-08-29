import type { PropType } from "@mptool/all";
import { $Component, showToast } from "@mptool/all";

import type { VideoComponentOptions } from "../../../typings/index.js";

$Component({
  props: {
    /** 媒体组件配置 */
    config: {
      type: Object as PropType<VideoComponentOptions>,
      required: true,
    },
  },

  lifetimes: {
    attached() {
      // FIXME: Now skyline has bugs in setPassiveEvent
      if (this.renderer !== "skyline")
        this.setPassiveEvent?.({
          touchstart: false,
          touchmove: false,
        });
    },
  },

  methods: {
    /** 视频缓冲时提示用户等待 */
    wait(): void {
      showToast("缓冲中..");
    },

    /** 正常播放时隐藏提示 */
    play(): void {
      wx.hideToast();
    },

    /** 提示用户加载出错 */
    error(): void {
      showToast("视频加载出错");
      wx.reportEvent?.("resource_load_failed", {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        broken_url: this.data.config.src,
      });
    },
  },
});
