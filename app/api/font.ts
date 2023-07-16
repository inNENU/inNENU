export const loadFZSSJW = (global = false): void => {
  wx.loadFontFace({
    family: "FZSSJW",
    source: "url('https://assets.innenu.com/assets/nenu.ttf')",
    global,
  });
};
