declare namespace WechatMiniprogram {
  /** 接口调用结束的回调函数(调用成功、失败都会执行) */
  type OpenOfficialAccountArticleCompleteCallback = (
    res: GeneralCallbackResult,
  ) => void;
  /** 接口调用失败的回调函数 */
  type OpenOfficialAccountArticleFailCallback = (
    res: GeneralCallbackResult,
  ) => void;
  /** 接口调用成功的回调函数 */
  type OpenOfficialAccountArticleSuccessCallback = (
    res: GeneralCallbackResult,
  ) => void;

  interface OpenOfficialAccountArticleOption {
    /**
     * 需要打开的公众号地址
     */
    url: string;

    /** 接口调用结束的回调函数(调用成功、失败都会执行) */
    complete?: OpenOfficialAccountArticleCompleteCallback;

    /** 接口调用失败的回调函数 */
    fail?: OpenOfficialAccountArticleFailCallback;

    /** 接口调用成功的回调函数 */
    success?: OpenOfficialAccountArticleSuccessCallback;
  }

  interface BackgroundAudioManager {
    /**
     * 关联页面路径。设置后，当点击播放器上的小程序跳转链接时，将跳转到这个关联页面路径（实验特性，目前仅安卓端支持）
     */
    referrerPath: string;

    /**
     * 音频类型。可设置 "audio" 和 "music" 两种值，默认为 "audio"。不同音频类型对应的播放器样式不一样（实验特性，目前仅安卓端支持）
     */
    audioType: "audio" | "music";
  }

  interface Wx {
    /**
     * 通过小程序打开任意公众号文章（不包括临时链接等异常状态下的公众号文章），必须有点击行为才能调用成功
     */
    openOfficialAccountArticle(option: OpenOfficialAccountArticleOption): void;
  }
}

declare namespace WechatMiniprogram.Component {
  // FIXME: https://github.com/wechat-miniprogram/api-typings/issues/306
  interface PassiveEventOptions {
    touchstart: boolean;
    touchmove: boolean;
    wheel: boolean;
  }

  interface InstanceProperties {
    renderer?: "webview" | "skyline";
  }
}

declare namespace WechatMiniprogram.Page {
  interface PassiveEventOptions {
    touchstart: boolean;
    touchmove: boolean;
    wheel: boolean;
  }

  interface InstanceProperties {
    renderer?: "webview" | "skyline";
  }
}
