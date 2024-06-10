import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  LocationComponentOptions,
  LocationConfig,
} from "../../../typings/index.js";
import { info } from "../../state/index.js";

const getPoint = (point: LocationConfig & { id: number }): string =>
  JSON.stringify({
    name: point.name,
    latitude: point.latitude,
    longitude: point.longitude,
  });

$Component({
  properties: {
    /** 普通列表配置 */
    config: {
      type: Object as PropType<LocationComponentOptions>,
      required: true,
    },
  },

  data: {
    markers: [] as (LocationConfig & { id: number })[],
    id: -1,
    title: "",
    hasDetail: false,
  },

  lifetimes: {
    attached() {
      const { config } = this.data;

      this.setData({
        title: config.title,
        markers: config.points.map((point, index) => ({
          name: config.title,
          detail: "详情",
          id: index,
          ...point,
        })),
      });
    },

    ready() {
      // add delay to make sure `<map />` is rendered
      setTimeout(() => {
        // FIXME: fix crash on iOS
        if (this.data.config.points.length === 1 && info.platform === "ios") {
          const { latitude, longitude } = this.data.config.points[0];

          this.setData({
            includePoints: [
              { latitude, longitude },
              { latitude: latitude - 0.03, longitude: longitude - 0.03 },
              { latitude: latitude + 0.03, longitude: longitude + 0.03 },
            ],
          });
        } else {
          this.setData({
            includePoints: this.data.config.points.map((point) => ({
              longitude: point.longitude,
              latitude: point.latitude,
            })),
          });
        }
      }, 500);
    },
  },

  methods: {
    detail() {
      const { id, hasDetail } = this.data;

      if (hasDetail) {
        const point = this.data.markers[id];

        this.$go(`location?id=${point.path!}&point=${getPoint(point)}`);
      }
    },

    markerTap({ detail }: WechatMiniprogram.MarkerTap) {
      const id = detail.markerId;
      const point = this.data.markers[id];

      this.setData({ id, title: point.name, hasDetail: Boolean(point.path) });

      if (point.path) this.$preload(`location?id=${point.path}`);
    },
  },
});
