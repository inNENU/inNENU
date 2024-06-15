import { $Page } from "@mptool/all";

import type {
  Category,
  MarkerConfig,
  MarkerData,
} from "../../../../../typings/index.js";
import { showModal, showToast } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import {
  ensureJson,
  getJson,
  showNotice,
  startNavigation,
} from "../../../../utils/index.js";
import type { Area } from "../../utils/index.js";
import { benbuArea, jingyueArea } from "../../utils/index.js";

const PAGE_ID = "map";
const PAGE_TITLE = "东师地图";

$Page(PAGE_ID, {
  data: {
    /** 地图数据 */
    map: {
      latitude: 43.862007982140646,
      longitude: 125.33405307523934,
      scale: 17,
    },

    /** 显示地点列表 */
    showLocation: false,
    /** 显示导航 */
    showNavigate: false,
    /** 显示卫星图 */
    showSatellite: false,

    /** 弹窗设置 */
    locationPopup: {
      title: "全部",
      subtitle: "地点列表",
      cancel: false,
      confirm: false,
    },
    navigatePopup: {
      title: "导航",
      cancel: false,
      confirm: false,
    },

    /** 当前分类 */
    currentCategory: "all",

    /** 校区 */
    area: "benbu" as Area,

    /** 点位分类 */
    category: [] as Category[],

    /** 地图点位 */
    marker: {} as Record<string, MarkerData[]>,
  },

  /** 状态 */
  state: {
    gestureHold: false,
    isSet: false,
    benbu: {
      category: [] as Category[],
      marker: {} as Record<string, MarkerData[]>,
    },
    jingyue: {
      category: [] as Category[],
      marker: {} as Record<string, MarkerData[]>,
    },
  },

  context: {} as WechatMiniprogram.MapContext,

  onNavigate() {
    console.info("Navigating to Map");
    ensureJson("function/map/marker/benbu");
    ensureJson("function/map/marker/jingyue");
  },

  onLoad(options: { area?: "benbu" | "jingyue" }) {
    wx.showLoading({ title: "加载中...", mask: true });

    const area = options.area || this.getArea();
    // 创建地图对象
    const mapContext = wx.createMapContext("map");

    // 注入地图实例
    this.context = mapContext;

    this.setData({
      area,
      statusBarHeight: info.statusBarHeight,
      tabHeight: info.windowHeight / 2 - 20,
    });

    showNotice(PAGE_ID);
  },

  onShow() {
    wx.requirePrivacyAuthorize?.({});
  },

  onReady() {
    this.setMarker().then(() => {
      // 将地图缩放到对应的校区
      this.context.includePoints(
        this.data.area === "benbu" ? benbuArea : jingyueArea,
      );

      // 1200ms 之后拿到缩放值和地图中心点坐标，写入地图组件配置
      setTimeout(() => {
        this.setMap();
      }, 1200);

      wx.hideLoading();
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { area } = this.data;

    return { title: PAGE_TITLE, path: `/pkg/tool/pages/map/map?area=${area}` };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { area } = this.data;

    return { title: PAGE_TITLE, query: `area=${area}` };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { area } = this.data;

    return {
      title: PAGE_TITLE,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `area=${area}`,
    };
  },

  onResize({ size }) {
    this.setData({
      tabHeight: size.windowHeight / 2 - 20,
    });
  },

  /** 设置地图 */
  setMap() {
    this.context.getScale({
      success: ({ scale }) => {
        this.context.getCenterLocation({
          success: ({ latitude, longitude }) => {
            this.setData({ map: { scale, latitude, longitude } });
          },
        });
      },
    });
  },

  /** 获得当前校区 */
  getArea(): Area {
    const value = wx.getStorageSync<Area | undefined>("map-area");

    if (value) return value;

    wx.setStorageSync("map-area", "benbu");

    return "benbu";
  },

  /** 生成点位 */
  setMarker() {
    const promises = ["benbu", "jingyue"].map((path) =>
      getJson<MarkerConfig>(`function/map/marker/${path}`)
        .then((markerData) => {
          this.state[path as Area] = markerData;
        })
        .catch((err) => {
          console.log("Marked failed with", err);
          showModal(
            "获取失败",
            "地图点位获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者",
            () => {
              this.$back();
            },
          );
        }),
    );

    return Promise.all(promises).then(() => {
      const { category, marker } = this.state[this.data.area];

      return new Promise<void>((resolve) =>
        this.setData({ category, marker }, resolve),
      );
    });
  },

  changeSatellite() {
    this.setData({
      showSatellite: !this.data.showSatellite,
    });
  },

  changeArea() {
    const area = this.data.area === "benbu" ? "jingyue" : "benbu";

    this.setData({ area, marker: this.state[area].marker });

    // 重新缩放校区
    this.context.includePoints(area === "benbu" ? benbuArea : jingyueArea);

    // 1000ms 之后拿到缩放值和地图中心点坐标，写入地图组件配置
    setTimeout(() => {
      this.setMap();
    }, 1000);

    wx.setStorageSync("map-area", area);
  },

  /**
   * 获取缩放值
   *
   * @param event 触摸事件
   */
  scale(event: WechatMiniprogram.TouchEvent) {
    this.context.getCenterLocation({
      success: ({ latitude, longitude }) => {
        this.setData({
          map: {
            scale:
              this.data.map.scale +
              (event.currentTarget.dataset.action === "zoom-in" ? 1 : -1),
            latitude,
            longitude,
          },
        });
      },
    });
  },

  /** 移动到当前坐标 */
  moveToLocation() {
    this.context.moveToLocation();
  },

  /** 选择分类 */
  select({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { name, path } = this.data.category[index];
    const markers = this.state[this.data.area].marker[path];

    this.setData({
      currentCategory: path,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "locationPopup.title": name,
    });
    this.context.includePoints({ padding: [30, 20, 30, 20], points: markers });
  },

  markerTap(event: WechatMiniprogram.MarkerTap) {
    const { area, currentCategory } = this.data;

    const item = this.data.marker[currentCategory].find(
      (item) => item.id === event.detail.markerId,
    )!;

    if (event.type === "markertap") {
      if (item.path) this.$preload(`map-detail?id=${area}/${item.path}`);
    } else if (event.type === "callouttap") {
      if (item.path) {
        const point = JSON.stringify({
          latitude: item.latitude,
          longitude: item.longitude,
          name: item.name,
        });

        this.$go(`map-detail?id=${area}/${item.path}&point=${point}`);
      } else {
        showToast("该地点暂无详情");
      }
    }
  },

  toggleLocationPopup() {
    this.setData({ showLocation: !this.data.showLocation });
  },

  toggleNavigatePopup() {
    this.setData({ showNavigate: !this.data.showNavigate });
  },

  navigate({ currentTarget }: WechatMiniprogram.TouchEvent) {
    const { name, latitude, longitude } = this.data.marker.all.find(
      (item) => item.id === Number(currentTarget.dataset.id),
    )!;

    startNavigation(JSON.stringify({ latitude, longitude, name }));
  },

  openLocation({ currentTarget }: WechatMiniprogram.TouchEvent) {
    const { area, currentCategory } = this.data;

    const { name, latitude, longitude, path } = this.data.marker[
      currentCategory
    ].find((item) => item.id === currentTarget.dataset.id)!;

    if (path) {
      const point = JSON.stringify({ latitude, longitude, name });

      this.$go(`map-detail?id=${area}/${path}&point=${point}`);
    } else {
      showToast("该地点暂无详情");
    }
  },

  regionChange(event: WechatMiniprogram.RegionChange) {
    if (event.causedBy === "gesture" && event.type === "begin")
      this.state.gestureHold = true;

    // 用户对地图进行了缩放或移动
    if (
      (event.causedBy === "scale" || event.causedBy === "drag") &&
      event.type === "end" &&
      this.state.gestureHold
    ) {
      this.context.getScale({
        success: ({ scale }) => {
          this.context.getCenterLocation({
            success: ({ latitude, longitude }) => {
              this.setData({
                map: { scale, latitude, longitude },
              });
            },
          });
        },
      });

      this.state.gestureHold = false;
    }
  },

  update(event: WechatMiniprogram.MapUpdated) {
    console.log("update", event);
  },
});
