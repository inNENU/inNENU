import { assets } from "../config/index.js";

export const loadFZSSJW = (global = false): void => {
  wx.loadFontFace({
    family: "FZSSJW",
    source: `url('${assets}assets/nenu.ttf')`,
    global,
    scopes: ["webview", "skyline"],
  });
};
