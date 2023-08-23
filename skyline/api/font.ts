import { assets } from "../config/info.js";

export const loadFZSSJW = (global = false): void => {
  wx.loadFontFace({
    family: "FZSSJW",
    source: `url('${assets}assets/nenu.ttf')`,
    global,
  });
};
