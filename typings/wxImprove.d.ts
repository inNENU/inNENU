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

    /** 个性化地图使用的key */
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

  type NodeInfo = Partial<
    NodeRectInfo &
      NodeSizeInfo &
      NodeScrollOffsetInfo & {
        id: string;
        mark: IAnyObject;
        dataset: IAnyObject;
        properties: string[];
        computedStyle: string[];
        node: {
          getContext: (type: string) => CanvasContext;
        } & NodeRectInfo &
          NodeSizeInfo;
      }
  >;

  // FIXME: Wait for tool chain
  interface AuthSetting {
    /**
     * Added in Feb. 24 2022
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "scope.addPhoneContact"?: boolean;
  }
}
