import { $Page, logger, showToast } from "@mptool/all";

import type {
  LyricData,
  MusicInfo,
  MusicList,
} from "../../../../../typings/index.js";
import { loadFZSSJW } from "../../../../api/index.js";
import { appCoverPrefix, appName } from "../../../../config/index.js";
import { appInfo } from "../../../../state/index.js";
import {
  ensureJson,
  getAssetLink,
  getJson,
  showNotice,
} from "../../../../utils/index.js";
import type { MusicState, PlayMode } from "../../utils/index.js";

const musicState: MusicState = { playing: false, index: 0 };

/** 音频管理器 */
const manager = wx.getBackgroundAudioManager();

$Page("music", {
  data: {
    /** 是否可以播放 */
    canplay: false,
    /** 是否正在播放 */
    playing: false,
    /** 正在播放的歌的序列号 */
    index: 0,
    /** 当前时间 */
    currentTime: 0,
    /** 歌曲总长度 */
    totalTime: 1,
    /** 当前歌曲信息 */
    currentSong: {} as MusicInfo,
    /** 是否展示歌曲列表 */
    showSongList: false,
    /** 歌曲列表 */
    songList: [] as MusicList,
    /** 播放模式 */
    mode: "列表循环" as PlayMode,

    /** 激活的歌词序号 */
    currentLyricId: -1,
    /** 当前歌词 */
    currentLyric: "",
    /** 歌词配置 */
    lyrics: [] as LyricData,

    /** 弹窗配置 */
    popupConfig: {
      title: "歌曲列表",
      confirm: false,
      cancel: false,
    },
  },

  state: {
    interrupted: false,
  },

  onNavigate() {
    ensureJson("function/music/index");
  },

  onLoad(option) {
    const mode = wx.getStorageSync<PlayMode | undefined>("play-mode");
    const { darkmode } = appInfo;

    if (!mode) wx.setStorageSync("play-mode", "列表循环");

    // 写入基本信息
    this.setData({
      playing: musicState.playing,
      mode: mode || "列表循环",

      darkmode,
      indicatorColor: darkmode
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.15)",
      indicatorActiveColor: darkmode
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.45)",
    });

    getJson<MusicList>("function/music/index").then((songData) => {
      const songList = songData.map((item) => ({
        ...item,
        cover: getAssetLink(item.cover),
        src: getAssetLink(item.src),
      }));

      if (option.index) {
        musicState.index = Number(option.index);
      } else if (option.name) {
        const name = decodeURI(option.name);

        musicState.index = songList.findIndex((song) => song.title === name);
      } else {
        const name = wx.getStorageSync<string | undefined>("music");

        if (name)
          musicState.index = songList.findIndex((song) => song.title === name);
      }

      const { index } = musicState;
      const currentSong = songList[index];

      // 写入歌曲列表与当前歌曲信息
      this.setData({
        index,
        songList: songList.map((item) => ({
          ...item,
          cover: getAssetLink(item.cover),
          src: getAssetLink(item.src),
        })),
        currentSong,
      });

      // 如果正在播放，设置能够播放
      if (musicState.playing) {
        this.setData({ canplay: true });
      }
      // 对音频管理器进行设置
      else {
        manager.epname = appName;
        manager.src = currentSong.src;
        manager.title = currentSong.title;
        manager.singer = currentSong.singer;
        manager.coverImgUrl = currentSong.cover;
        manager.referrerPath = "/pkg/tool/pages/music/music";
        manager.audioType = "music";
      }

      this.initLyric();
    });

    // 注册播放器动作
    this.managerRegister();

    loadFZSSJW();
    showNotice("music");
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.currentSong.title,
      path: `/pkg/tool/pages/music/music?name=${this.data.currentSong.title}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.currentSong.title,
      query: `name=${this.data.currentSong.title}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.currentSong.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `name=${this.data.currentSong.title}`,
    };
  },

  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult) {
    this.setData({
      darkmode: theme === "dark",
      indicatorColor:
        theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
      indicatorActiveColor:
        theme === "dark" ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
    });
  },

  /** 注册音乐播放器 */
  managerRegister() {
    // 能够播放 100ms 后设置可以播放
    manager.onCanplay(() => {
      // 调试
      console.debug("Canplay current music");
      this.setData({ canplay: true });
    });

    // 在相应动作时改变状态
    manager.onPlay(() => {
      console.info("play");
      this.setData({ playing: true });
      musicState.playing = true;
    });

    manager.onPause(() => {
      console.info("pause");
      this.setData({ playing: false });
      musicState.playing = false;
    });

    manager.onTimeUpdate(() => {
      console.debug("timeupdate:", manager.currentTime);
      // 更新歌曲信息
      this.setData({
        currentTime: Math.round(manager.currentTime * 100) / 100,
        totalTime: Math.round(manager.duration * 100) / 100,
        canplay: true,
      });

      this.lyric();
    });

    // 缓冲中
    manager.onWaiting(() => {
      console.info("waiting");
      this.setData({ canplay: false });
    });

    manager.onPrev(() => {
      console.info("previous");
      this.previous();
    });

    // 歌曲播放结束
    manager.onEnded(() => {
      console.info("Music ends");
      this.end();
    });

    // 歌曲播放结束
    manager.onStop(() => {
      console.warn("Music Stops by closing popup");
      this.setData({ currentTime: 0, playing: false });
      this.state.interrupted = true;
    });

    manager.onNext(() => {
      this.next();
    });

    manager.onError((res) => {
      logger.error("音频播放器错误", res);
      showToast("音乐播放出错");
    });
  },

  initLyric() {
    const { lyric } = this.data.currentSong;

    if (lyric)
      getJson<LyricData>(`function/music/${lyric}`).then((lyrics) => {
        this.setData({
          currentLyric: "",
          currentLyricId: -1,
          lyrics,
        });
      });
    else
      this.setData({
        currentLyric: "",
        currentLyricId: -1,
        lyrics: [] as LyricData,
      });
  },

  /** 设置歌词 */
  lyric() {
    const { currentLyricId, lyrics } = this.data;
    let id = 0;

    /** 如果当前时间大于本项且本项不是最后一项 */
    while (id < lyrics.length && this.data.currentTime > lyrics[id].time)
      id += 1;

    if (currentLyricId !== id - 1 && id !== 0)
      this.setData({
        currentLyricId: id - 1,
        currentLyric: lyrics[id - 1].text || " ",
      });
  },

  loadCover(event: WechatMiniprogram.ImageLoad) {
    // 加载封面
    if (event.type === "load") this.setData({ coverLoad: true });
  },

  /** 播放与暂停 */
  play() {
    if (this.state.interrupted) {
      manager.src = this.data.currentSong.src;
      this.state.interrupted = false;
    } else if (this.data.playing) {
      manager.pause();
    } else {
      manager.play();
    }
  },

  /** 拖拽进度 */
  drag(event: WechatMiniprogram.SliderChange) {
    if (this.state.interrupted) {
      manager.src = this.data.currentSong.src;
      this.state.interrupted = false;
    }

    if (event.type === "change") {
      manager.seek(event.detail.value / 100);

      this.setData({ currentTime: event.detail.value / 100, canplay: false });
    }
  },

  end() {
    // 结束动作
    const { index } = this.data;
    const total = this.data.songList.length;
    let result: number | "stop";

    switch (this.data.mode) {
      case "随机播放":
        do result = Math.round(Math.random() * total - 0.5);
        while (index === result);
        break;
      case "顺序播放":
        result = index + 1 === total ? "stop" : index + 1;
        showToast("播放完毕");
        break;
      case "单曲循环":
        result = index;
        break;
      case "列表循环":
      default:
        result = index + 1 === total ? 0 : index + 1;
    }

    this.switchSong(result);
  },

  /** 下一曲动作 */
  next() {
    const { index } = this.data;
    const total = this.data.songList.length;
    let result: number | "nothing";

    switch (this.data.mode) {
      case "随机播放":
        do result = Math.round(Math.random() * total - 0.5);
        while (index === result);
        break;
      case "顺序播放":
        if (index + 1 === total) {
          result = "nothing";
          showToast("已是最后一曲");
        } else {
          result = index + 1;
        }
        break;
      case "单曲循环":
      case "列表循环":
      default:
        result = index + 1 === total ? 0 : index + 1;
    }

    this.switchSong(result);
  },

  /** 上一曲动作 */
  previous() {
    const { index } = this.data;
    const total = this.data.songList.length;
    let result: number | "nothing";

    switch (this.data.mode) {
      case "随机播放":
        do result = Math.round(Math.random() * total - 0.5);
        while (index === result);
        break;
      case "顺序播放":
        if (index === 0) {
          result = "nothing";
          showToast("已是第一曲");
        } else {
          result = index - 1;
        }
        break;
      case "单曲循环":
      case "列表循环":
      default:
        result = index === 0 ? total - 1 : index - 1;
    }
    this.switchSong(result);
  },

  /** 切换歌曲 */
  switchSong(index: "stop" | "nothing" | number) {
    if (index === "stop") {
      this.setData({ playing: false, canPlay: false });

      manager.stop();
      // 正常赋值
    } else if (index !== "nothing") {
      const currentSong = this.data.songList[index];

      this.setData({
        currentLyricId: -1,
        currentSong,
        index,
        playing: false,
        canPlay: false,
      });

      manager.src = currentSong.src;
      manager.title = currentSong.title;
      manager.singer = currentSong.singer;
      manager.coverImgUrl = currentSong.cover;
      musicState.index = Number(index);

      this.initLyric();

      wx.setStorageSync("music", currentSong.title);
    }
  },

  /** 切换播放模式 */
  modeSwitch() {
    const modes: PlayMode[] = [
      "列表循环",
      "单曲循环",
      "顺序播放",
      "随机播放",
      "列表循环",
    ];
    const mode = modes[modes.indexOf(this.data.mode) + 1];

    this.setData({ mode });

    wx.setStorageSync("play-mode", mode);
    showToast(`切换为${mode}模式`);
  },

  /** 切换列表显隐 */
  list() {
    this.setData({ showSongList: !this.data.showSongList });
  },

  // 点击列表具体歌曲项时触发
  change({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    this.list();
    this.switchSong(currentTarget.dataset.index);
  },
});
