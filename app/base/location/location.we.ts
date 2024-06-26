import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  LocationComponentOptions,
  LocationConfig,
} from "../../../typings/index.js";
import { showToast } from "../../api/index.js";
import { startNavigation } from "../../utils/index.js";

const getPoint = (point: LocationConfig & { id: number }): string =>
  JSON.stringify({
    name: point.name,
    latitude: point.latitude,
    longitude: point.longitude,
  });

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
        this.createSelectorQuery()
          .select("#location")
          .context(({ context }) => {
            (context as WechatMiniprogram.MapContext).includePoints({
              points: this.data.config.points.map((point) => ({
                longitude: point.longitude,
                latitude: point.latitude,
              })),
              padding: [24, 24, 24, 24],
            });
          })
          .exec();
      }, 500);
    },
  },

  methods: {
    navigate() {
      const { config, id, markers } = this.data;

      if (config.navigate !== false)
        if (id === -1)
          if (markers.length === 1) startNavigation(getPoint(markers[0]));
          else showToast("请选择一个点");
        else startNavigation(getPoint(markers[id]));
    },

    detail() {
      const { id, hasDetail } = this.data;

      if (hasDetail) {
        const point = this.data.markers[id];

        this.$go(`map-detail?id=${point.path!}&point=${getPoint(point)}`);
      }
    },

    onMarkerTap({ detail }: WechatMiniprogram.MarkerTap) {
      const id = detail.markerId;
      const point = this.data.markers[id];

      this.setData({ id, title: point.name, hasDetail: Boolean(point.path) });

      if (point.path) this.$preload(`map-detail?id=${point.path}`);
    },

    onCalloutTap({ detail }: WechatMiniprogram.CalloutTap) {
      const point = this.data.markers[detail.markerId];
      const { navigate } = this.data.config;

      if (point.path)
        this.$go(`map-detail?id=${point.path}&point=${getPoint(point)}`);
      else if (navigate !== false)
        startNavigation(getPoint(this.data.markers[detail.markerId]));
    },
  },
});
