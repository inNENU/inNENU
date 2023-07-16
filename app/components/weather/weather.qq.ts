import { $Component, set } from "@mptool/all";

import { type WeatherData } from "./typings.js";
import { type AppOption } from "../../app.js";
import { WEATHER_KEY, server } from "../../config/index.js";
import { MINUTE } from "../../utils/constant.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    target: String,
  },

  data: {
    /** 提示的索引值 */
    tipIndex: 0,
    /** 天气信息 */
    weather: <WeatherData>{},
    statusBarHeight: globalData.info.statusBarHeight,
  },

  lifetimes: {
    attached() {
      this.getWeather();
    },
  },

  methods: {
    /* 获取天气信息 */
    getWeather(): void {
      wx.request<WeatherData>({
        url: `${server}service/weather.php`,
        method: "POST",
        enableHttp2: true,
        success: ({ data }) => {
          this.setData({ weather: data });

          // 将天气详情和获取时间写入存储，避免重复获取
          set(WEATHER_KEY, data, 5 * MINUTE);
        },
      });
    },

    /** 变更提示信息 */
    refresh(): void {
      const { length } = this.data.weather.tips;
      const { tipIndex } = this.data;

      this.setData({ tipIndex: tipIndex === 0 ? length - 1 : tipIndex - 1 });
    },

    navigate(): void {
      const { target } = this.data;

      if (target) this.$go(target);
    },
  },

  options: {
    styleIsolation: "apply-shared",
  },

  externalClasses: ["custom-class"],
});
