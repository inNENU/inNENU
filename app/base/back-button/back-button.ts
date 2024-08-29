import type { ComponentInstance } from "@mptool/all";
import { $Component } from "@mptool/all";

import { appInfo, windowInfo } from "../../state/index.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type BackButtonProps = {
  icon: {
    type: StringConstructor;
    default: string;
  };
  action: {
    type: StringConstructor;
    default: string;
  };
};

interface BackButtonData {
  statusBarHeight: number;
  src?: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type BackButtonMethods = {
  setImageLink(isDarkMode: boolean): void;
  onTap(): void;
};

interface BackButtonInstanceMethod {
  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult): void;
}

type BackButtonComponentInstance = ComponentInstance<
  BackButtonData,
  BackButtonProps,
  BackButtonMethods,
  BackButtonInstanceMethod
>;

$Component<
  BackButtonData,
  BackButtonProps,
  BackButtonMethods,
  BackButtonInstanceMethod
>({
  props: {
    icon: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      default: "",
    },
  },

  data: {
    statusBarHeight: windowInfo.statusBarHeight,
  },

  lifetimes: {
    attached() {
      this.onThemeChange = function (
        this: BackButtonComponentInstance,
        { theme }: WechatMiniprogram.OnThemeChangeListenerResult,
      ): void {
        this.setImageLink(theme === "dark");
      }.bind(this);

      this.setImageLink(appInfo.darkmode);
      wx.onThemeChange?.(this.onThemeChange);
    },

    detached() {
      wx.offThemeChange?.(this.onThemeChange);
    },
  },

  methods: {
    setImageLink(isDarkMode: boolean) {
      this.setData({
        src: `./icon/${getCurrentPages().length === 1 ? "home" : "back"}-${isDarkMode ? "white" : "black"}.svg`,
      });
    },

    onTap() {
      if (this.data.action) {
        this.$call(this.data.action);
      } else {
        this.$back();
      }
    },
  },

  externalClasses: ["button-class"],
});
