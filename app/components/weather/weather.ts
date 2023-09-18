import { $Component, set } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { WEATHER_KEY } from "../../config/index.js";
import { MINUTE } from "../../utils/constant.js";
import type { WeatherData } from "../../widgets/weather/getWeather.js";
import {
  getOnlineWeather,
  getWeather,
} from "../../widgets/weather/getWeather.js";

const { globalData, useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
    target: String,
  },

  data: {
    /** 提示的索引值 */
    tipIndex: 0,
    /** 天气信息 */
    weather: <WeatherData | null>null,
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
    changeHint() {
      const { weather, tipIndex } = this.data;

      this.setData({ tipIndex: (tipIndex + 1) % weather!.tips.length });
    },
  },

  externalClasses: ["wrapper-class"],
});
