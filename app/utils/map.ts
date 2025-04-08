import { appName } from "../config/index.js";

export interface PointOptions {
  name?: string;
  loc: `${number},${number}`;
}

export const getLocation = (
  loc: string,
): {
  latitude: number;
  longitude: number;
} => {
  const [latitude, longitude] = loc.split(",").map(Number);

  return { latitude, longitude };
};

export const getPointConfig = ({ name, loc }: PointOptions): string =>
  JSON.stringify({ name: name ?? "目的地", ...getLocation(loc) });

export const startNavigation = (options: PointOptions): void => {
  wx.navigateTo({
    url: `plugin://route-plan/index?key=7ZXBZ-DZO6W-TK3RO-OGHG5-4J4EQ-PBFFX&referer=${appName}&endPoint=${getPointConfig(options)}&mode=walking&themeColor=#2ecc71`,
  });
};
