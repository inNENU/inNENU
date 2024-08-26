import type { ComponentInstance, PropType } from "@mptool/all";
import { $Component, logger } from "@mptool/all";

import type { AudioComponentOptions } from "../../../typings/index.js";
import { showToast } from "../../api/ui.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type AudioProps = {
  config: {
    type: PropType<AudioComponentOptions>;
    required: true;
  };
};

interface AudioData {
  canPlay: boolean;
  isPlaying: boolean;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type AudioMethods = {
  toggle(): void;
};

interface AudioInstanceMethod {
  instance: WechatMiniprogram.InnerAudioContext | null;
  destroy(): void;
}

type AudioComponentInstance = ComponentInstance<
  AudioData,
  AudioProps,
  AudioMethods,
  AudioInstanceMethod
>;

$Component<AudioData, AudioProps, AudioMethods, AudioInstanceMethod>({
  props: {
    /** 媒体组件配置 */
    config: {
      type: Object as PropType<AudioComponentOptions>,
      required: true,
    },
  },

  data: {
    canPlay: false,
    isPlaying: false,
  },

  lifetimes: {
    attached() {
      const { src, autoplay = false, loop = false } = this.data.config;

      const instance = (this.instance = wx.createInnerAudioContext());

      const onCanPlay = function (this: AudioComponentInstance): void {
        console.log("can play");
        this.setData({ canPlay: true });
      }.bind(this);
      const onWaiting = function (this: AudioComponentInstance): void {
        console.log("waiting");
        this.setData({ canPlay: false });
      }.bind(this);

      const onPlay = function (this: AudioComponentInstance): void {
        console.log("play");
        this.setData({ isPlaying: true });
      }.bind(this);

      const onPause = function (this: AudioComponentInstance): void {
        console.log("pause");
        this.setData({ isPlaying: false });
      }.bind(this);

      const onTimeUpdate = function (this: AudioComponentInstance): void {
        const instance = this.instance!;

        console.log("time update");

        this.setData({
          canPlay: true,
          currentTime: Math.round(instance.currentTime * 100) / 100,
          totalTime: Math.round(instance.duration * 100) / 100,
        });
      }.bind(this);

      const onError = function (
        this: AudioComponentInstance,
        { errMsg }: WechatMiniprogram.InnerAudioContextOnErrorListenerResult,
      ): void {
        logger.error("音频组件错误", errMsg);
        showToast("获取音频出错，请稍后重试");
      }.bind(this);

      instance.onPlay(onPlay);
      instance.onPause(onPause);
      instance.onTimeUpdate(onTimeUpdate);
      instance.onCanplay(onCanPlay);
      instance.onWaiting(onWaiting);
      instance.onError(onError);
      instance.src = src;
      instance.autoplay = autoplay;
      instance.loop = loop;

      this.setData({
        isPlaying: !instance.paused,
      });

      this.destroy = (): void => {
        instance.offPlay(onPlay);
        instance.offPause(onPause);
        instance.offTimeUpdate(onTimeUpdate);
        instance.offCanplay(onCanPlay);
        instance.offWaiting(onWaiting);
        instance.offError(onError);
        instance.stop();
        instance.destroy();
      };
    },
    detached() {
      this.destroy();
    },
  },

  methods: {
    toggle() {
      const instance = this.instance!;

      instance[instance.paused ? "play" : "pause"]();
    },
  },
});
