export const preloadSkyline = (): void => {
  setTimeout(() => {
    wx.preloadSkylineView();
  }, 200);
};
