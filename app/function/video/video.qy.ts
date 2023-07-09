import { $Page } from "@mptool/enhance";

import { showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { loadFZSSJW } from "../../utils/font.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

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
    videoList: <VideoGroup[]>[],
    src: "",
  },

  onNavigate() {
    ensureJSON("function/video/index");
  },

  onLoad(options) {
    getJSON<VideoGroup[]>("function/video/index").then((videoList) => {
      let groupID = 0;
      let listID = 0;

      if (options.scene) {
        const ids = options.scene.split("-").map((id) => Number(id));

        [groupID, listID] = ids;
      } else if (options.name) {
        const name = decodeURI(options.name);

        videoList.forEach((videoGroup, groupIndex) => {
          const listIndex = videoGroup.list.findIndex(
            (videoItem) => videoItem.name === name
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

        firstPage: getCurrentPages().length === 1,
        statusBarHeight: globalData.info.statusBarHeight,
        theme: globalData.theme,
        darkmode: globalData.darkmode,
      });
    });

    loadFZSSJW();
    popNotice("video");
  },

  onShow() {
    this.createSelectorQuery()
      .select(".video-list")
      .fields({ size: true }, (res) => {
        if (res) this.setData({ height: res.height as number });
      })
      .exec();
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

  /** 切换播放视频 */
  onListTap(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { groupID: number; listID: number }
    >
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

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$reLaunch("main");
    else this.$back();
  },
});
