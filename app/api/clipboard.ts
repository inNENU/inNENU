export const copyContent = (data = ""): Promise<void> =>
  data
    ? new Promise<void>((resolve, reject) => {
        wx.setClipboardData({
          data,
          success: () => resolve(),
          fail: (err) => reject(new Error(err.errMsg)),
        });
      })
    : Promise.reject(new Error("data is empty"));
