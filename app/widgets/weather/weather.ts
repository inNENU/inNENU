import type { PropType } from "@mptool/all";
import { $Component, get, readFile, set } from "@mptool/all";

import { INITIALIZED_KEY, MINUTE, WEATHER_KEY } from "../../config/index.js";
import type { WeatherData } from "../../service/index.js";
import { getWeather } from "../../service/index.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<
        | "今日天气 (小)"
        | "今日天气"
        | "近日天气 (小)"
        | "近日天气"
        | "近日天气 (大)"
      >,
      default: "今日天气",
    },
  },

  data: {
    /** 提示的索引值 */
    tipIndex: 0,
    /** 天气信息 */
    weather: null as WeatherData | null,
  },

  lifetimes: {
    created() {
      this.updateIcon = this.updateIcon.bind(this);
    },
    attached() {
      const { type } = this.data;

      if (wx.getStorageSync(INITIALIZED_KEY)) {
        const weatherIcon = JSON.parse(
          readFile("./icon/weather/icon") || "{}",
        ) as Record<string, string>;
        const hintIcon = JSON.parse(
          readFile("./icon/weather/hint") || "{}",
        ) as Record<string, string>;

        this.setData({
          // 18 点至次日 5 点为夜间
          night: new Date().getHours() > 18 || new Date().getHours() < 5,
          weatherIcon,
          hintIcon,
        });
      } else {
        // update icon
        this.$on("inited", this.updateIcon);
      }

      this.setData({
        size: getSize(type),
        id: type.includes("今日") ? "today" : "recent",
      });
      this.getWeather();
    },
    detached() {
      this.$off("inited", this.updateIcon);
    },
  },

  methods: {
    async getWeather(): Promise<void> {
      let weather = get<WeatherData>(WEATHER_KEY);

      if (!weather) {
        weather = await getWeather();
        set(WEATHER_KEY, weather, 5 * MINUTE);
      }

      this.setData({
        temperature: `${weather.dayForecast[1].minDegree}° - ${weather.dayForecast[1].maxDegree}°`,
        weather,
      });
    },

    updateIcon() {
      this.setData({
        weatherIcon: JSON.parse(readFile("./icon/weather/icon")!) as Record<
          string,
          string
        >,
        hintIcon: JSON.parse(readFile("./icon/weather/hint")!) as Record<
          string,
          string
        >,
      });
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
