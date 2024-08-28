declare namespace WechatMiniprogram {
  interface RequestOption {
    /** 是否启用高性能模式 */
    useHighPerformanceMode?: boolean;
  }

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

  interface GeneralScopeData {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "@type": "general";
    /**
     * 内容标识
     *
     * appid下全局唯一，长度不大于256字符
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    uniq_id: string;
    /**
     * 内容标题
     *
     * 该页面内容的主题，不超过100个字符
     */
    title: string;
    /**
     * 内容缩略图
     *
     * 该页面包含图片或者能描述该页面的图片URL，宽高比1: 1，建议500x500px，不超过10张
     */
    thumbs: string[];
    /**
     * 内容封面大图
     *
     * 能描述该页面的封面大图URL，适用于需要大图表现的内容(如视频)，宽高比16: 9，宽度不低于800px，限定1张
     */
    cover?: string;
    /**
     * 内容摘要
     *
     * 该页面的摘要内容，不超过200个字符
     */
    digest: string;
    /**
     * 内容关键词
     *
     * 能描述该页面的关键词，不超过10个，每个关键词不超过10个字符
     */
    tags: string[];
  }
}
