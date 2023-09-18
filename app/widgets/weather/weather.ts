import { $Component, PropType, readFile, set } from "@mptool/all";

import type { WeatherData } from "./getWeather.js";
import { getOnlineWeather, getWeather } from "./getWeather.js";
import type { AppOption } from "../../app.js";
import { INITIALIZED_KEY, WEATHER_KEY } from "../../config/index.js";
import { MINUTE } from "../../utils/constant.js";
import { getSize } from "../utils.js";

const { useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
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
    weather: <WeatherData | null>null,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      if (wx.getStorageSync(INITIALIZED_KEY)) {
        const weatherIcon = <Record<string, string>>(
          JSON.parse((readFile("./icon/weather/icon") as string) || "{}")
        );
        const hintIcon = <Record<string, string>>(
          JSON.parse((readFile("./icon/weather/hint") as string) || "{}")
        );

        this.setData({
          // 18 点至次日 5 点为夜间
          night: new Date().getHours() > 18 || new Date().getHours() < 5,
          weatherIcon,
          hintIcon,
        });
      } else {
        // update icon
        this.updateIcon = this.updateIcon.bind(this);
        this.$on("inited", this.updateIcon);
      }

      this.setData({
        size: getSize(type),
        id: type.includes("今日") ? "today" : "recent",
      });
      this.getWeather();
    },
  },

  methods: {
    getWeather(): Promise<void> {
      return (
        useOnlineService("weather") ? getOnlineWeather : getWeather
      )().then((weather) => {
        this.setData({ weather });
        set(WEATHER_KEY, weather, 5 * MINUTE);
      });
    },

    updateIcon() {
      this.setData({
        weatherIcon: <Record<string, string>>(
          JSON.parse(readFile("./icon/weather/icon") as string)
        ),
        hintIcon: <Record<string, string>>(
          JSON.parse(readFile("./icon/weather/hint") as string)
        ),
      });
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
