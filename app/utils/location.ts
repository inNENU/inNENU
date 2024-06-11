import { appName } from "../config/index.js";

/*@__NO_SIDE_EFFECTS__*/
export const startNavigation = (point: string): void => {
  wx.navigateTo({
    url: `plugin://routePlan/index?key=7ZXBZ-DZO6W-TK3RO-OGHG5-4J4EQ-PBFFX&referer=${appName}&endPoint=${point}&mode=walking&themeColor=#2ecc71`,
  });
};
