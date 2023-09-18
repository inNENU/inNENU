import { $Component, set } from "@mptool/all";

import type { WeatherData } from "./getWeather.js";
import { getOnlineWeather, getWeather } from "./getWeather.js";
import type { AppOption } from "../../app.js";
import { WEATHER_KEY } from "../../config/index.js";
import { MINUTE } from "../../utils/constant.js";

const { globalData, useOnlineService } = getApp<AppOption>();

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
    getWeather(): Promise<void> {
      return (
        useOnlineService("weather") ? getOnlineWeather : getWeather
      )().then((weather) => {
        this.setData({ weather });
        set(WEATHER_KEY, weather, 5 * MINUTE);
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

  externalClasses: ["wrapper-class"],
});
