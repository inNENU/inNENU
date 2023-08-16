/* eslint-disable */
declare namespace WechatMiniprogram {
  /** 地图设置 */
  interface MapSettings {
    /** 倾斜角度，范围 0 ~ 40 , 关于 z 轴的倾角.默认为 0 */
    skew?: number;
    /** 旋转角度，范围 0 ~ 360, 地图正北和设备 y 轴角度的夹角，默认为 0 */
    rotate?: number;

    /** 显示带有方向的当前定位点，默认为 false */
    showLocation?: boolean;
    /** 显示比例尺，默认为 false */
    showScale?: boolean;
    /** 显示指南针，默认为 false */
    showCompass?: boolean;

    /** 个性化地图使用的 key */
    subKey?: string;
    /** 个性化地图配置的 style，不支持动态修改 */
    layerStyle?: number;

    /** 显是否支持缩放，默认为 true */
    enableZoom?: boolean;
    /** 是否支持拖动，默认为 true */
    enableScroll?: boolean;
    /** 是否支持旋转，默认为 false */
    enableRotate?: boolean;
    /** 展示3D楼块，默认为 false */
    enable3D?: boolean;
    /** 开启俯视，默认为 false */
    enableOverlooking?: boolean;
    /** 是否开启卫星图，默认为 false */
    enableSatellite?: boolean;
    /** 是否开启实时路况，默认为 false */
    enableTraffic?: boolean;
  }

  interface NodeRectInfo {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  interface NodeSizeInfo {
    width: number;
    height: number;
  }

  interface NodeScrollOffsetInfo {
    scrollLeft?: number;
    scrollTop?: number;
  }

  type Canvas2DNode = NodeRectInfo &
    NodeSizeInfo & {
      getContext: (type: string) => CanvasRenderingContext2D;
    };

  type NodeInfo = Partial<
    NodeRectInfo &
      NodeSizeInfo &
      NodeScrollOffsetInfo & {
        id: string;
        mark: IAnyObject;
        dataset: IAnyObject;
        properties: string[];
        computedStyle: string[];
        node: Canvas2DNode;
      }
  >;

  interface DonutLaunchMiniProgramCallbackResult {
    /** 返回的数据 */
    data: unknown;
  }

  interface DonutLaunchMiniProgramOptions {
    /** 要打开的小程序的原始 ID */
    userName: string;
    /** 打开的页面路径，如果为空则打开首页 */
    path?: string;
    /**
     * 可选打开 0-正式版，1-开发版，2-体验版
     * @default 0
     */
    miniprogramType?: 0 | 1 | 2;
    /** 成功回调 */
    success?: (res: DonutLaunchMiniProgramCallbackResult) => void;
  }

  interface DonutInstallAppOptions {
    /** Apk 的文件路径 */
    filePath: string;
  }

  interface Wx {
    /** 多端框架接口 */
    miniapp: {
      /** 启动小程序 */
      launchMiniProgram: (options: DonutLaunchMiniProgramOptions) => void;
      /** 安装 Apk，仅 Android */
      installApp: (options: DonutInstallAppOptions) => void;
    };
  }
}

// FIXME: https://github.com/wechat-miniprogram/api-typings/issues/306
// prettier-ignore
declare namespace WechatMiniprogram.Component {
  interface PassiveEventOptions {
    touchstart: boolean;
    touchmove: boolean;
    wheel: boolean;
  }

  interface InstanceMethods<D extends DataOption> {
    /** 设置被动事件 */
    setPassiveEvent: (events: Partial<PassiveEventOptions>) => void;

    /** 获取节点信息 */
    getPassiveEvent: (callback: (options: PassiveEventOptions) => void) => void;
  }
}
