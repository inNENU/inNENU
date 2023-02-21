import { $Page } from "@mptool/enhance";
import { readFile } from "@mptool/file";

import { type AppOption } from "../../app";
import { type WeatherData } from "../../components/weather/typings";
import { modal } from "../../utils/api";
import { appCoverPrefix, server } from "../../utils/config";

const {
  globalData: { darkmode, info },
} = getApp<AppOption>();

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
    const weatherData = wx.getStorageSync<
      | {
          date: number;
          data: WeatherData;
        }
      | undefined
    >("weather");

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

        firstPage: getCurrentPages().length === 1,
        statusBarHeight: info.statusBarHeight,
        darkmode,
      });
    } else {
      // update icon
      this.updateIcon = this.updateIcon.bind(this);
      this.$on("inited", this.updateIcon);
    }

    // 如果天气数据获取时间小于 5 分钟，则可以使用
    if (weatherData && weatherData.date > new Date().getTime() - 300000) {
      const weather = weatherData.data;

      this.drawcanvas(weather);

      this.setData({ weather });
    }
    // 需要重新获取并处理
    else {
      wx.request<WeatherData>({
        url: `${server}service/weather.php`,
        enableHttp2: true,
        success: ({ data }) => {
          this.drawcanvas(data);
          this.setData({ weather: data });
        },
      });
    }

    // 设置页面背景色
    wx.setBackgroundColor({
      backgroundColorTop: darkmode ? "#000000" : "#efeef4",
      backgroundColor: darkmode ? "#000000" : "#efeef4",
      backgroundColorBottom: darkmode ? "#000000" : "#efeef4",
    });

    this.backgroundChange();
  },

  onShareAppMessage: () => ({
    title: "东师天气",
    path: "/function/weather/weather",
  }),

  onShareTimeline: () => ({ title: "东师天气" }),

  onAddToFavorites: () => ({
    title: "体测计算器",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    /** 移除旋转屏幕与加速度计监听 */
    wx.stopAccelerometer({
      success: () => console.info("Stoped accelerometer listening"),
    });
    this.$off("inited", this.updateIcon);
  },

  /** 屏幕变化时重绘画布 */
  onResize({ size }) {
    this.drawcanvas(this.data.weather, size.windowWidth);
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
  drawcanvas(
    weather: WeatherData,
    windowWidth = wx.getSystemInfoSync().windowWidth
  ) {
    if (wx.canIUse("canvas.type"))
      wx.createSelectorQuery()
        .select(".canvas")
        .fields({ node: true, size: true })
        .exec(
          ([
            { node, width, height },
          ]: Required<WechatMiniprogram.NodeInfo>[]) => {
            if (node) {
              const context = node.getContext("2d");
              const dpr = info.pixelRatio;

              node.width = width * dpr;
              node.height = height * dpr;
              context.scale(dpr, dpr);
              this.draw(context, weather, windowWidth);
            } else {
              this.canvasOldDraw(weather, windowWidth);
            }
          }
        );
    else this.canvasOldDraw(weather, windowWidth);
  },

  // eslint-disable-next-line
  draw(
    canvasContent: WechatMiniprogram.CanvasContext,
    weather: WeatherData,
    // 屏幕宽度可能发生变化
    width: number
  ) {
    const highTemperature: number[] = [];
    const lowTemperature: number[] = [];
    const { dayForecast } = weather;
    let max = -50;
    let min = 50;

    // 生成最高 / 最低温
    dayForecast.forEach((element) => {
      const maxDegreee = Number(element.maxDegree);
      const minDegree = Number(element.minDegree);

      highTemperature.push(maxDegreee);
      lowTemperature.push(minDegree);
      if (maxDegreee > max) max = maxDegreee;
      if (minDegree < min) min = minDegree;
    });

    /** 温差 */
    const gap = max - min;

    canvasContent.beginPath();
    canvasContent.lineWidth = 2;
    canvasContent.font = "16px sans-serif";

    canvasContent.strokeStyle = "#ffb74d";
    canvasContent.fillStyle = "#ffb74d";

    // 绘制高温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 32);
      else canvasContent.lineTo(x, y + 32);
    }
    canvasContent.stroke();

    // 绘制高温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 32, 3, 0, Math.PI * 2);
      canvasContent.fill();

      canvasContent.fillText(`${dayForecast[i].maxDegree}°`, x - 10, y + 20);
    }

    canvasContent.beginPath();

    canvasContent.strokeStyle = "#4fc3f7";
    canvasContent.fillStyle = "#4fc3f7";

    // 绘制低温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 20);
      else canvasContent.lineTo(x, y + 20);
    }
    canvasContent.stroke();

    // 绘制低温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 20, 3, 0, Math.PI * 2);
      canvasContent.fill();

      canvasContent.fillText(`${dayForecast[i].minDegree}°`, x - 10, y + 44);
    }
  },

  /**
   * 绘制温度曲线
   *
   * @param weather 天气详情
   */
  // eslint-disable-next-line
  canvasOldDraw(
    weather: WeatherData,
    // 屏幕宽度可能发生变化
    width: number
  ) {
    /** 天气画布组件 */
    const canvasContent = wx.createCanvasContext("weather");
    const highTemperature: number[] = [];
    const lowTemperature: number[] = [];
    const { dayForecast } = weather;
    let max = -50;
    let min = 50;

    // 生成最高 / 最低温
    dayForecast.forEach((element) => {
      const maxDegreee = Number(element.maxDegree);
      const minDegree = Number(element.minDegree);

      highTemperature.push(maxDegreee);
      lowTemperature.push(minDegree);
      if (maxDegreee > max) max = maxDegreee;
      if (minDegree < min) min = minDegree;
    });

    /** 温差 */
    const gap = max - min;

    canvasContent.beginPath();
    canvasContent.lineWidth = 2;
    canvasContent.font = "16px sans-serif";

    canvasContent.strokeStyle = "#ffb74d";
    canvasContent.fillStyle = "#ffb74d";

    // 绘制高温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 32);
      else canvasContent.lineTo(x, y + 32);
    }
    canvasContent.stroke();
    canvasContent.draw();

    // 绘制高温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 32, 3, 0, Math.PI * 2);
      canvasContent.fill();
      canvasContent.draw(true);

      canvasContent.fillText(`${dayForecast[i].maxDegree}°`, x - 10, y + 20);
      canvasContent.draw(true);
    }

    canvasContent.beginPath();

    canvasContent.strokeStyle = "#4fc3f7";
    canvasContent.fillStyle = "#4fc3f7";

    // 绘制低温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 20);
      else canvasContent.lineTo(x, y + 20);
    }
    canvasContent.stroke();
    canvasContent.draw(true);

    // 绘制低温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 20, 3, 0, Math.PI * 2);
      canvasContent.fill();
      canvasContent.draw(true);

      canvasContent.fillText(`${dayForecast[i].minDegree}°`, x - 10, y + 44);
      canvasContent.draw(true);
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
    >
  ) {
    const hint = this.data.weather.hints[event.currentTarget.dataset.id];

    modal(hint.name, hint.detail);
  },

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$reLaunch("main");
    else this.$back();
  },
});
