import type { PropType } from "@mptool/all";
import { $Component, showToast } from "@mptool/all";

import type {
  LocationComponentOptions,
  LocationConfig,
} from "../../../typings/index.js";
import { getLocation, startNavigation } from "../../utils/index.js";

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
          ...getLocation(point.loc),
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
              points: this.data.config.points.map(({ loc }) =>
                getLocation(loc),
              ),
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
          if (markers.length === 1) startNavigation(markers[0]);
          else showToast("请选择一个点");
        else startNavigation(markers[id]);
    },

    detail() {
      const { id } = this.data;

      const { loc, path } = this.data.markers[id];

      this.$go(`map-detail?id=${path!}&loc=${loc}`);
    },

    onMarkerTap({ detail }: WechatMiniprogram.MarkerTap) {
      const id = detail.markerId;
      const { name, path } = this.data.markers[id];

      this.setData({ id, title: name, hasDetail: Boolean(path) });

      if (path) this.$preload(`map-detail?id=${path}`);
    },

    onCalloutTap({ detail }: WechatMiniprogram.CalloutTap) {
      const { name, path, loc } = this.data.markers[detail.markerId];
      const { navigate } = this.data.config;

      if (path) this.$go(`map-detail?id=${path}&loc=${loc}`);
      else if (navigate !== false) startNavigation({ name, loc });
    },
  },
});
