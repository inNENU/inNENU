import { $Page } from "@mptool/enhance";
import { get, readFile } from "@mptool/file";

import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { type WeatherData } from "../../components/weather/typings.js";
import { appCoverPrefix, server } from "../../config/info.js";
import { WEATHER_KEY } from "../../config/keys.js";
import { getColor } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_TITLE = "东师天气";
const CANVAS_SELECTOR = ".temperature-canvas";

$Page("weather", {
  data: {
    /** 天气数据 */
    weather: <WeatherData>{},
    /** 当前 tips 的索引值 */
    tipIndex: 0,
    /** 动画对象 */
    animation: {},
  },

  state: {
    weatherIcon: <Record<string, string>>{},
  },

  onLoad() {
    const weather = get<WeatherData>(WEATHER_KEY);

    if (wx.getStorageSync("app-inited")) {
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

        color: getColor(),
        firstPage: getCurrentPages().length === 1,
        statusBarHeight: globalData.info.statusBarHeight,
      });
    } else {
      // update icon
      this.updateIcon = this.updateIcon.bind(this);
      this.$on("inited", this.updateIcon);
    }

    // 如果天气数据获取时间小于 5 分钟，则可以使用
    if (weather) {
      this.drawCanvas(weather);

      this.setData({ weather });
    }
    // 需要重新获取并处理
    else {
      wx.request<WeatherData>({
        url: `${server}service/weather.php`,
        enableHttp2: true,
        success: ({ data }) => {
          this.drawCanvas(data);
          this.setData({ weather: data });
        },
      });
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
  onResize({ size }) {
    this.drawCanvas(this.data.weather, size.windowWidth);
  },

  updateIcon(): void {
    this.setData({
      weatherIcon: <Record<string, string>>(
        JSON.parse(readFile("./icon/weather/icon") as string)
      ),
      hintIcon: <Record<string, string>>(
        JSON.parse(readFile("./icon/weather/hint") as string)
      ),
    });
  },

  /**
   * 绘制温度曲线
   *
   * @param weather 天气详情
   */
  drawCanvas(
    weather: WeatherData,
    windowWidth = wx.getSystemInfoSync().windowWidth,
  ) {
    this.createSelectorQuery()
      .select(CANVAS_SELECTOR)
      .fields({ node: true, size: true })
      .exec(
        ([
          { node: canvas, width, height },
        ]: Required<WechatMiniprogram.NodeInfo>[]) => {
          const dpr = globalData.info.pixelRatio;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          this.draw(canvas, weather, windowWidth);
        },
      );
  },

  draw(
    canvas: WechatMiniprogram.Canvas2DNode,
    weather: WeatherData,
    // 屏幕宽度可能发生变化
    width: number,
  ) {
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
    const dpr = globalData.info.pixelRatio;

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
  refresh() {
    const { length } = this.data.weather.tips;
    const numbers = this.data.tipIndex;

    this.setData({ tipIndex: numbers === 0 ? length - 1 : numbers - 1 });
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

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$reLaunch("main");
    else this.$back();
  },
});
