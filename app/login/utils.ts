// 小程序会自动解析 302，所以我们需要检查 WebVPN 是否已失效
export const isWebVPNPage = (content: string): boolean =>
  content.includes("fuckvpn") || content.includes("东北师范大学 WebVPN");
