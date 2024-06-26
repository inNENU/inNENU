import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import { appCoverPrefix, appName } from "../../config/index.js";
import {
  agreeLicense,
  agreePrivacy,
  getLicenseStatus,
  getPrivacyStatus,
} from "../../utils/index.js";

type ResolvePrivacy = (
  options: { buttonId: string; event: "agree" } | { event: "disagree" },
) => void;

let resolvePrivacy: ResolvePrivacy | null = null;

$Component({
  props: {
    type: {
      type: String as PropType<"license" | "privacy">,
      default: "privacy",
    },
  },

  data: {
    logo: `${appCoverPrefix}.png`,
    show: false,
    appName,
  },

  lifetimes: {
    async attached() {
      const { type } = this.data;

      if (type === "privacy") {
        if (typeof wx.onNeedPrivacyAuthorization === "function") {
          wx.onNeedPrivacyAuthorization((resolve) => {
            resolvePrivacy = resolve as unknown as ResolvePrivacy;
            this.setData({ show: true });
          });
        } else {
          this.setData({
            show: (await getPrivacyStatus()).needAuthorize,
          });
        }
      } else {
        this.setData({ show: (await getLicenseStatus()).needAuthorize });
      }
    },
  },

  methods: {
    accept() {
      const { type } = this.data;

      if (type === "privacy") {
        if (resolvePrivacy) {
          resolvePrivacy({ buttonId: "", event: "agree" });
          this.setData({ show: false });
        } else {
          agreePrivacy();
          this.setData({ show: false });
        }
      } else {
        agreeLicense();
        this.setData({ show: false });
      }
    },

    refuse() {
      const { type } = this.data;

      if (type === "privacy" && resolvePrivacy)
        resolvePrivacy({ event: "disagree" });

      this.setData({ show: false });
      this.$back();
    },
  },
});
