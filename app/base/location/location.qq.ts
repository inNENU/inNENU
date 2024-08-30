import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  LocationComponentOptions,
  LocationConfig,
} from "../../../typings/index.js";
import { platform } from "../../state/index.js";
import { getLocation, getPointConfig } from "../../utils/index.js";

$Component({
  props: {
    /** 普通列表配置 */
    config: {
      type: Object as PropType<LocationComponentOptions>,
      required: true,
    },
  },

  data: {
    markers: [] as (LocationConfig & { id: number })[],
    id: -1,
    header: "",
    hasDetail: false,
  },

  lifetimes: {
    attached() {
      const { config } = this.data;

      this.setData({
        header: config.header,
        markers: config.points.map((point, index) => ({
          name: config.header,
          detail: "详情",
          id: index,
          ...getLocation(point.loc),
          ...point,
        })),
      });
    },

    ready() {
      // add delay to make sure `<map />` is rendered
      setTimeout(() => {
        // FIXME: fix crash on iOS
        if (this.data.config.points.length === 1 && platform === "ios") {
          const { latitude, longitude } = getLocation(
            this.data.config.points[0].loc,
          );

          this.setData({
            includePoints: [
              { latitude, longitude },
              { latitude: latitude - 0.03, longitude: longitude - 0.03 },
              { latitude: latitude + 0.03, longitude: longitude + 0.03 },
            ],
          });
        } else {
          this.setData({
            includePoints: this.data.config.points.map(({ loc }) =>
              getLocation(loc),
            ),
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

        this.$go(`map-detail?id=${point.path!}&point=${getPointConfig(point)}`);
      }
    },

    onMarkerTap({ detail }: WechatMiniprogram.MarkerTap) {
      const id = detail.markerId;
      const point = this.data.markers[id];

      this.setData({ id, title: point.name, hasDetail: Boolean(point.path) });

      if (point.path) this.$preload(`map-detail?id=${point.path}`);
    },
  },
});
