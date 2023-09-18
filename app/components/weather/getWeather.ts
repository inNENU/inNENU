/* eslint-disable @typescript-eslint/naming-convention */
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

type Time = `${number}${number}:${number}${number}`;
type Date =
  `${number}${number}${number}${number}${number}${number}${number}${number}`;

interface WeatherRawData {
  data: {
    air: {
      aqi: number;
      aqi_level: number;
      aqi_name: string;
      co: string;
      no2: string;
      o3: string;
      pm10: string;
      "pm2.5": string;
      so2: string;
    };

    /** 天气预警 */
    alarm: {
      [props: number]: {
        /** 城市 */
        city: string;
        /** 区域 */
        country: string;
        /** 报警详情 */
        detail: string;
        /** 信息 */
        info: string;
        /** 级别代码 */
        level_code: string;
        /** 级别名称 */
        level_name: string;
        /** 省份 */
        province: string;
        /** 类型代码 */
        type_code: string;
        /** 类型名称 */
        type_name: string;
        /** 更新时间 */
        update_time: string;
        /** 对应地址 */
        url: string;
      };
    };

    forecast_1h: Record<
      `${number}`,
      {
        degree: string;
        update_time: string;
        weather: string;
        weather_code: string;
        weather_short: string;
        wind_direction: string;
        wind_power: string;
      }
    >;

    forecast_24h: Record<
      `${number}`,
      {
        day_weather: string;
        day_weather_code: string;
        day_weather_short: string;
        day_wind_direction: string;
        day_wind_direction_code: string;
        day_wind_power: string;
        day_wind_power_code: string;
        max_degree: string;
        min_degree: string;
        night_weather: string;
        night_weather_code: string;
        night_weather_short: string;
        night_wind_direction: string;
        night_wind_direction_code: string;
        night_wind_power: string;
        night_wind_power_code: string;
        time: string;
      }
    >;

    index: {
      time: string;
      [type: string]:
        | {
            detail: string;
            info: string;
            name: string;
          }
        | string;
    };

    limit: {
      tail_number: string;
      time: string;
    };

    observe: {
      degree: string;
      humidity: string;
      precipitation: string;
      pressure: string;
      update_time: string;
      weather: string;
      weather_code: string;
      weather_short: "多云";
      wind_direction: string;
      wind_power: string;
    };

    rise: Record<
      number,
      {
        sunrise: Time;
        sunset: Time;
        time: Date;
      }
    >;

    tips: {
      observe: {
        [props: string]: string;
      };
    };
  };
  status: 200;
}

/**
 * 获得天气代码
 *
 * @param icon 天气代码
 * @param isDay 当前是否是白天
 */
const getWeatherCode = (icon: string, isDay: boolean): string =>
  (icon === "00" || icon === "01" || icon === "03" || icon === "13"
    ? isDay
      ? "day/"
      : "night/"
    : "") + icon;

const getWindDirection = (direction: string): string =>
  direction === "8"
    ? "北"
    : direction === "1"
    ? "东北"
    : direction === "2"
    ? "东"
    : direction === "3"
    ? "东南"
    : direction === "4"
    ? "南"
    : direction === "5"
    ? "西南"
    : direction === "6"
    ? "西"
    : direction === "7"
    ? "西北"
    : "未知";

export interface WeatherAirInfo {
  /** 空气质量 */
  aqi: number;
  /** 空气质量等级 */
  aqiLevel: number;
  /** 空气质量描述 */
  aqiName: string;
  co: number;
  no2: number;
  o3: number;
  pm10: number;
  pm25: number;
  so2: number;
}

interface WeatherAlarm {
  level: string;
  type: string;
  text: string;
}

/** 一小时天气预报详情 */
export interface WeatherForecast1H {
  /** 摄氏度 */
  degree: string;
  /** 更新时间 */
  time: string;
  /** 天气代码 */
  weatherCode: string;
}

/** 24小时天气预报详情 */
export interface WeatherForecast24H {
  /** 日间天气 */
  dayWeather: string;
  /** 日间天气代码 */
  dayWeatherCode: string;
  /** 日间天气缩写 */
  dayWeatherShort: string;
  /** 最高温 */
  maxDegree: string;
  /** 最低温 */
  minDegree: string;
  /** 夜间温度 */
  nightWeather: string;
  /** 夜间温度代码 */
  nightWeatherCode: string;
  /** 夜间温度缩写 */
  nightWeatherShort: string;
  /** 夜间风向 */
  nightWindDirection: string;
  /** 夜间风力 */
  nightWindPower: string;
  /** 星期 */
  weekday: string;
}

export interface WeatherHint {
  id: string;
  name: string;
  info: string;
  detail: string;
}

export interface WeatherObserveInfo {
  /** 温度 */
  degree: string;
  /** 湿度 */
  humidity: string;
  /** 降水量 */
  precipitation: string;
  /** 压力 */
  pressure: string;
  /** 更新时间 */
  updateTime: string;
  /** 天气 */
  weather: string;
  /** 天气代码 */
  weatherCode: string;
  /** 天气缩写 */
  weatherShort: string;
  /** 风向 */
  windDirection: string;
  /** 风力 */
  windPower: string;
}

export interface WeatherRiseInfo {
  /** 日出时间 */
  sunrise: string;
  /** 日落时间 */
  sunset: string;
  /** 日期 */
  time: string;
}

/** 天气详情 */
export interface WeatherData {
  air: WeatherAirInfo;
  /** 天气预警 */
  alarm: WeatherAlarm[];
  /** 天预报 */
  dayForecast: WeatherForecast24H[];
  /** 小时预报 */
  hourForecast: WeatherForecast1H[];
  /** 实时数据 */
  observe: WeatherObserveInfo;
  /** 日出日落时间 */
  rise: WeatherRiseInfo[];
  tips: string[];
  hints: WeatherHint[];
}

export const getWeather = async (): Promise<WeatherData> => {
  const {
    data: { alarm, ...data },
  } = await request<WeatherRawData>(
    `https://wis.qq.com/weather/common?source=pc&weather_type=observe|rise|forecast_1h|forecast_24h|index|alarm|limit|tips&province=吉林&city=长春&county=南关`,
  );
  const {
    data: { air },
  } = await request<WeatherRawData>(
    `https://wis.qq.com/weather/common?source=pc&weather_type=air&province=吉林&city=长春`,
  );

  const {
    aqi,
    aqi_level: aqiLevel,
    aqi_name: aqiName,
    co,
    no2,
    o3,
    pm10,
    "pm2.5": pm25,
    so2,
  } = air;
  const {
    wind_direction: windDirection,
    weather_code: weatherCode,
    weather_short: weatherShort,
    weather,
    degree,
    wind_power: windPower,
    humidity,
    precipitation,
    pressure,
    update_time: updateTime,
  } = data.observe;

  const rise = Object.entries(data.rise)
    .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
    .map(([, value]) => value);

  const hints = [
    ...Object.entries(data.index)
      .filter(([id]) => id !== "time")
      .map(([id, value]) => ({
        id,
        ...(<{ name: string; info: string; detail: string }>value),
      })),
    {
      id: "tailnumber",
      name: "尾号限行",
      info: data.limit.tail_number,
      detail: `今日尾号限行情况: 限行${data.limit.tail_number}尾号`,
    },
  ];

  const hourForecast = Object.entries(data.forecast_1h)
    .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
    .map(([, value]) => value)
    .map(({ degree, update_time: updateTime, weather_code: weatherCode }) => {
      const { sunrise, sunset } = rise.find(
        (item) => item.time === updateTime.substring(0, 8),
      )!;
      const hour = Number(updateTime.substring(8, 10));
      const sunriseHour = Number(sunrise.substring(0, 2));
      const sunsetHour = Number(sunset.substring(0, 2));
      const isDay = sunriseHour < hour && hour <= sunsetHour;

      const weather = {
        degree: `${degree}°`,
        weatherCode: getWeatherCode(weatherCode, isDay),
        time: `${updateTime.substring(8, 10)}:${updateTime.substring(10, 12)}`,
      };

      if (hour === sunriseHour)
        return [
          weather,
          {
            degree: "日出",
            weatherCode: "rise",
            time: sunrise,
          },
        ];

      if (hour === sunsetHour)
        return [
          weather,
          {
            degree: "日落",
            weatherCode: "set",
            time: sunset,
          },
        ];

      return weather;
    })
    .flat();

  const dayForecast = Object.entries(data.forecast_24h)
    .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
    .map(
      ([
        index,
        {
          day_weather: dayWeather,
          day_weather_short: dayWeatherShort,
          day_weather_code: dayWeatherCode,
          day_wind_direction: dayWindDirection,
          day_wind_power: dayWindPower,
          night_weather: nightWeather,
          night_weather_code: nightWeatherCode,
          night_weather_short: nightWeatherShort,
          night_wind_direction: nightWindDirection,
          night_wind_power: nightWindPower,
          max_degree: maxDegree,
          min_degree: minDegree,
          time,
        },
      ]) => ({
        date: `${time.substring(5, 7)}/${time.substring(8, 10)}`,
        weekday:
          index === "0"
            ? "昨天"
            : index === "1"
            ? "今天"
            : index === "2"
            ? "明天"
            : index === "3"
            ? "后天"
            : `星期${
                ["天", "一", "二", "三", "四", "五", "六"][
                  (new Date().getDay() + Number(index) - 1) % 7
                ]
              }`,
        dayWeather,
        dayWeatherShort,
        dayWeatherCode: getWeatherCode(dayWeatherCode, true),
        dayWindPower,
        dayWindDirection: getWindDirection(dayWindDirection),
        nightWeather,
        nightWeatherShort,
        nightWeatherCode: getWeatherCode(nightWeatherCode, false),
        nightWindPower,
        nightWindDirection: getWindDirection(nightWindDirection),
        maxDegree,
        minDegree,
      }),
    );

  const tips = Object.values(data.tips.observe);

  return {
    air: {
      aqi,
      aqiLevel,
      aqiName,
      co: Number(co),
      no2: Number(no2),
      o3: Number(o3),
      pm10: Number(pm10),
      pm25: Number(pm25),
      so2: Number(so2),
    },
    alarm: Object.entries(alarm).map(
      ([, { detail, level_name: level, type_name: type }]) => ({
        level,
        type,
        text: detail,
      }),
    ),
    dayForecast,
    hourForecast,
    hints,
    observe: {
      weatherCode,
      weatherShort,
      weather,
      degree,
      windDirection: getWindDirection(windDirection),
      windPower,
      humidity,
      precipitation,
      pressure,
      updateTime,
    },
    rise,
    tips,
  };
};

export const getOnlineWeather = async (): Promise<WeatherData> =>
  request<WeatherData>(`${service}weather`);
