// 检测环境是否支持重定向
const [major, minor, patch] = (
  wx.getAppBaseInfo?.() || wx.getSystemInfoSync()
).SDKVersion.split(".").map(Number);

export const supportRedirect =
  major > 3 || (major === 3 && (minor > 2 || (minor === 2 && patch >= 2)));

// 小程序会自动解析 302，所以我们需要检查 WebVPN 是否已失效
export const isWebVPNPage = (content: string): boolean =>
  content.includes("fuckvpn") || content.includes("东北师范大学 WebVPN");