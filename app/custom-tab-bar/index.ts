import { $Component } from "@mptool/enhance";

$Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/main/main",
        text: "首页",
        lightIconPath: "/icon/tab/home-light.png",
        darkIconPath: "/icon/tab/home-dark.png",
        selectedIconPath: "/icon/tab/home.png",
      },
      {
        pagePath: "/pages/intro/intro",
        text: "东师介绍",
        lightIconPath: "/icon/tab/intro-light.png",
        darkIconPath: "/icon/tab/intro-dark.png",
        selectedIconPath: "/icon/tab/intro.png",
      },
      {
        pagePath: "/pages/guide/guide",
        text: "东师指南",
        lightIconPath: "/icon/tab/guide-light.png",
        darkIconPath: "/icon/tab/guide-dark.png",
        selectedIconPath: "/icon/tab/guide.png",
      },
      {
        pagePath: "/pages/function/function",
        text: "功能大厅",
        lightIconPath: "/icon/tab/function-light.png",
        darkIconPath: "/icon/tab/function-dark.png",
        selectedIconPath: "/icon/tab/function.png",
      },
      {
        pagePath: "/pages/user/user",
        text: "我的东师",
        lightIconPath: "/icon/tab/user-light.png",
        darkIconPath: "/icon/tab/user-dark.png",
        selectedIconPath: "/icon/tab/user.png",
      },
    ],
  },

  methods: {
    switchTab({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number; url: string }
    >) {
      const { index, url } = currentTarget.dataset;

      this.setData({ selected: index });
      wx.switchTab({ url });
    },
  },
});
