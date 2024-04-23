import { $Page, get, readFile, set } from "@mptool/all";

import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  INITIALIZED_KEY,
  MINUTE,
  WEATHER_KEY,
  appCoverPrefix,
} from "../../config/index.js";
import type { WeatherAlarm, WeatherData } from "../../service/index.js";
import { getOnlineWeather, getWeather } from "../../service/index.js";
import { info } from "../../state/info.js";
import { getColor } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();

const PAGE_TITLE = "东师天气";
const CANVAS_SELECTOR = ".temperature-canvas";

$Page("weather", {
  data: {
    /** 天气数据 */
    weather: {} as WeatherData,
    /** 当前 tips 的索引值 */
    tipIndex: 0,
    /** 动画对象 */
    animation: {},
  },

  state: {
    weatherIcon: {} as Record<string, string>,
  },

  onLoad() {
    const weather = get<WeatherData>(WEATHER_KEY);
    const currentHour = new Date().getHours();

    this.setData({
      // 18 点至次日 5 点为夜间
      infoClass: currentHour > 18 || currentHour < 5 ? "night" : "day",
      firstPage: getCurrentPages().length === 1,
      color: getColor(),
      statusBarHeight: info.statusBarHeight,
    });

    if (wx.getStorageSync(INITIALIZED_KEY)) {
      const weatherIcon = JSON.parse(
        (readFile("./icon/weather/icon") as string) || "{}",
      ) as Record<string, string>;
      const hintIcon = JSON.parse(
        (readFile("./icon/weather/hint") as string) || "{}",
      ) as Record<string, string>;

      this.setData({
        weatherIcon,
        hintIcon,
      });
    } else {
      // update icon
      this.updateIcon = this.updateIcon.bind(this);
      this.$on("inited", this.updateIcon);
    }

    if (weather) {
      this.drawCanvas(weather);
      this.setData({ weather });
    } else {
      (useOnlineService("weather") ? getOnlineWeather : getWeather)().then(
        (weather) => {
          this.drawCanvas(weather);
          this.setData({ weather });
          set(WEATHER_KEY, weather, 5 * MINUTE);
        },
      );
    }

    this.backgroundChange();
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/weather/weather",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    /** 移除旋转屏幕与加速度计监听 */
    wx.stopAccelerometer({
      success: () => console.info("Stopped accelerometer listening"),
    });
    this.$off("inited", this.updateIcon);
  },

  /** 屏幕变化时重绘画布 */
  onResize() {
    this.drawCanvas(this.data.weather);
  },

  updateIcon(): void {
    this.setData({
      weatherIcon: JSON.parse(
        readFile("./icon/weather/icon") as string,
      ) as Record<string, string>,
      hintIcon: JSON.parse(readFile("./icon/weather/hint") as string) as Record<
        string,
        string
      >,
    });
  },

  /**
   * 绘制温度曲线
   *
   * @param weather 天气详情
   */
  drawCanvas(weather: WeatherData) {
    this.createSelectorQuery()
      .select(CANVAS_SELECTOR)
      .fields({ node: true, size: true })
      .exec(
        ([
          { node: canvas, width, height },
        ]: Required<WechatMiniprogram.NodeInfo>[]) => {
          const dpr = info.pixelRatio;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          this.draw(canvas, weather);
        },
      );
  },

  draw(canvas: WechatMiniprogram.Canvas2DNode, weather: WeatherData) {
    const highTemperature: number[] = [];
    const lowTemperature: number[] = [];
    const { dayForecast } = weather;
    let max = -50;
    let min = 50;

    // 生成最高 / 最低温
    dayForecast.forEach((element) => {
      const maxDegree = Number(element.maxDegree);
      const minDegree = Number(element.minDegree);

      highTemperature.push(maxDegree);
      lowTemperature.push(minDegree);
      if (maxDegree > max) max = maxDegree;
      if (minDegree < min) min = minDegree;
    });

    /** 温差 */
    const gap = max - min;

    const context = canvas.getContext("2d");
    const dpr = info.pixelRatio;
    const width = (canvas.width * 5) / 8 / dpr;

    context.scale(dpr, dpr);

    // 清除画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.lineWidth = 2;
    context.font = "16px sans-serif";

    context.strokeStyle = "#ffb74d";
    context.fillStyle = "#ffb74d";

    // 绘制高温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      if (i === 0) context.moveTo(x, y + 32);
      else context.lineTo(x, y + 32);
    }
    context.stroke();

    // 绘制高温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      context.beginPath();
      context.arc(x, y + 32, 3, 0, Math.PI * 2);
      context.fill();

      context.fillText(`${dayForecast[i].maxDegree}°`, x - 10, y + 20);
    }

    context.beginPath();

    context.strokeStyle = "#4fc3f7";
    context.fillStyle = "#4fc3f7";

    // 绘制低温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      if (i === 0) context.moveTo(x, y + 20);
      else context.lineTo(x, y + 20);
    }
    context.stroke();

    // 绘制低温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      context.beginPath();
      context.arc(x, y + 20, 3, 0, Math.PI * 2);
      context.fill();

      context.fillText(`${dayForecast[i].minDegree}°`, x - 10, y + 44);
    }
  },

  /** 改变背景动画 */
  backgroundChange() {
    /** 动画选项 */
    const animationOptions: WechatMiniprogram.StepOption = {
      duration: 200,
      timingFunction: "ease",
    };
    /** 背景层1动画 */
    const layer1Animation = wx.createAnimation(animationOptions);
    /** 背景层2动画 */
    const layer2Animation = wx.createAnimation(animationOptions);
    /** 背景层3动画 */
    const layer3Animation = wx.createAnimation(animationOptions);

    wx.startAccelerometer({
      interval: "normal",
      success: () => console.info("Starts accelerometer listening"),
    });

    wx.onAccelerometerChange(({ x }) => {
      layer1Animation.translateX(x * 13.5).step();
      layer2Animation.translateX(x * 18).step();
      layer3Animation.translateX(x * 22.5).step();

      this.setData({
        animation1: layer1Animation.export(),
        animation2: layer2Animation.export(),
        animation3: layer3Animation.export(),
      });
    });
  },

  /** 更新提示 */
  changeHint() {
    const { weather, tipIndex } = this.data;

    this.setData({ tipIndex: (tipIndex + 1) % weather.tips.length });
  },

  showAqi() {
    const { aqi, aqiLevel, aqiName, co, so2, no2, pm10, pm25, o3 } =
      this.data.weather.air;

    showModal(
      "空气质量",
      `\
空气质量: ${aqi} ${aqiName}
等级: ${aqiLevel}级
CO: ${co}
O3: ${o3}
NO2: ${no2}
PM10: ${pm10}
pm2.5: ${pm25}
SO2: ${so2}\
`,
    );
  },

  showAlarm({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { alarm: WeatherAlarm }
  >) {
    const { level, text, type } = currentTarget.dataset.alarm;

    showModal("预警详情", `${type}${level}预警:\n${text}`);
  },

  /** 贴士详情 */
  hint(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { id: number }
    >,
  ) {
    const hint = this.data.weather.hints[event.currentTarget.dataset.id];

    showModal(hint.name, hint.detail);
  },
});
