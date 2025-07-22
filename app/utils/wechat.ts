import { env, savePhoto, showToast } from "@mptool/all";

export const showOfficialQRCode = (id: string): void => {
  if (env === "wx")
    // 微信客户端可打开图片长按扫码
    wx.previewImage({
      urls: [`https://open.weixin.qq.com/qr/code?username=${id}`],
    });
  // 其他平台保存至相册
  else
    savePhoto(`https://open.weixin.qq.com/qr/code?username=${id}`)
      .then(() => showToast("二维码已存至相册"))
      .catch(() => showToast("二维码保存失败"));
};

export const tryOpenOfficialProfile = (
  id: string,
  fallback?: () => void,
): void => {
  if (wx.openOfficialAccountProfile)
    wx.openOfficialAccountProfile({ username: id, fail: fallback });
  else fallback?.();
};
