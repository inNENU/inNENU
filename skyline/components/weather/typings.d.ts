/* eslint-disable @typescript-eslint/naming-convention */

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

/** 天气详情 */
export interface WeatherData {
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
  /** 小时预报 */
  hourForecast: WeatherForecast1H[];
  /** 天预报 */
  dayForecast: WeatherForecast24H[];
  /** 实时数据 */
  observe: {
    /** 温度 */
    degree: string;
    /** 湿度 */
    humidity: string;
    /** 降水量 */
    precipitation: string;
    /** 压力 */
    pressure: string;
    /** 更新时间 */
    update_time: string;
    /** 天气 */
    weather: string;
    /** 天气代码 */
    weatherCode: string;
    /** 天气缩写 */
    weather_short: string;
    /** 风向 */
    windDirection: string;
    /** 风力 */
    windPower: string;
  };
  /** 日出日落时间 */
  rise: {
    [props: number]: {
      /** 日出时间 */
      sunrise: string;
      /** 日落时间 */
      sunset: string;
      /** 日期 */
      time: string;
    };
  };
  tips: string[];
  hints: WeatherHint[];
}
