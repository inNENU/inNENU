import { $Page } from "@mptool/all";

import { loadFZSSJW, showToast } from "../../api/index.js";
import { appCoverPrefix, appName } from "../../config/index.js";
import { info } from "../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../utils/index.js";

interface VideoConfig {
  /** 视频名称 */
  name: string;
  /** 视频作者 */
  author: string;
  /** 视频地址 */
  src?: string;
  /** 腾讯视频 ID */
  vid: string;
}

interface VideoGroup {
  /** 分组名称 */
  title: string;
  /** 分组内容 */
  list: VideoConfig[];
}

$Page("video", {
  data: {
    type: "debug",
    videoName: "",
    videoList: [] as VideoGroup[],
    src: "",
  },

  onNavigate() {
    ensureJson("function/video/index");
  },

  onLoad(options) {
    getJson<VideoGroup[]>("function/video/index").then((list) => {
      let groupID = 0;
      let listID = 0;
      const videoList =
        // @ts-expect-error: The import can be changed by build target
        appName === "东师青年+"
          ? list
          : list
              .map((category) => ({
                title: category.title,
                list: category.list.filter((item) => !("vid" in item)),
              }))
              .filter((item) => item.list.length);

      if (options.scene) {
        const ids = options.scene.split("-").map((id) => Number(id));

        [groupID, listID] = ids;
      } else if (options.name) {
        const name = decodeURI(options.name);

        videoList.forEach((videoGroup, groupIndex) => {
          const listIndex = videoGroup.list.findIndex(
            (videoItem) => videoItem.name === name,
          );

          if (listIndex !== -1) {
            groupID = groupIndex;
            listID = listIndex;
          }
        });
      }

      const item = videoList[groupID].list[listID];

      this.setData({
        type: options.type || "about",

        groupID,
        listID,

        titles: videoList.map((videoListItem) => videoListItem.title),
        videoList,

        videoName: item.name,
        videoAuthor: item.author,
        src: item.src || "",
        vid: item.vid || "",

        theme: info.theme,
      });
    });

    loadFZSSJW();
    showNotice("video");

    // FIXME: Now skyline has bugs in setPassiveEvent
    if (this.renderer !== "skyline")
      this.setPassiveEvent?.({
        touchstart: false,
        touchmove: false,
      });
  },

  onReady() {
    this.resizeTabList();
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.videoName,
      path: `/function/video/video?type=${this.data.type}&name=${this.data.videoName}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.videoName,
      query: `type=${this.data.type}&name=${this.data.videoName}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.videoName,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.data.type}&name=${this.data.videoName}`,
    };
  },

  onResize() {
    this.resizeTabList();
  },

  resizeTabList() {
    this.createSelectorQuery()
      .select(".video-list")
      .fields({ size: true }, (res) => {
        if (res) this.setData({ height: res.height as number });
      })
      .exec();
  },

  /** 切换播放视频 */
  onListTap(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { groupID: number; listID: number }
    >,
  ) {
    const { groupID, listID } = event.currentTarget.dataset;

    const item = this.data.videoList[groupID].list[listID];

    this.setData({
      groupID,
      listID,
      videoName: item.name,
      videoAuthor: item.author,
      src: item.src || "",
      vid: item.vid || "",
    });
  },

  /** 视频缓冲时提示用户等待 */
  onVideoWait() {
    showToast("缓冲中..");
  },

  /** 正常播放时隐藏提示 */
  onVideoPlay() {
    wx.hideToast();
  },

  /** 提示用户视频加载出错 */
  onVideoError() {
    showToast("视频加载出错");
    // 调试
    wx.reportEvent?.("resource_load_failed", {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      broken_url: this.data.src,
    });
  },
});
