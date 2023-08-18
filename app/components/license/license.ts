import { $Component, PropType } from "@mptool/all";

import { appCoverPrefix, appName } from "../../config/info.js";
import {
  LicenseStatus,
  PrivacyStatus,
  agreeLicense,
  agreePrivacy,
  getLicenseStatus,
  getPrivacyStatus,
} from "../../utils/agreement.js";

type ResolvePrivacy = (
  options: { buttonId: string; event: "agree" } | { event: "disagree" },
) => void;

let licenseStatus: LicenseStatus | null = null;
let privacyStatus: PrivacyStatus | null = null;

let resolvePrivacy: ResolvePrivacy | null = null;

$Component({
  properties: {
    type: {
      type: String as PropType<"license" | "privacy">,
      default: "privacy",
    },
  },

  data: {
    logo: appCoverPrefix + ".png",
    show: false,
    appName,
  },

  lifetimes: {
    async attached() {
      const { type } = this.properties;

      if (type === "privacy") {
        if (typeof wx.onNeedPrivacyAuthorization === "function") {
          wx.onNeedPrivacyAuthorization((resolve) => {
            resolvePrivacy = <ResolvePrivacy>resolve;
            this.setData({ show: true });
          });
        } else {
          if (privacyStatus === null) privacyStatus = await getPrivacyStatus();

          this.setData({
            show: privacyStatus.needAuthorize,
          });
        }
      } else {
        if (licenseStatus === null) licenseStatus = await getLicenseStatus();

        this.setData({ show: licenseStatus.needAuthorize });
      }
    },
  },

  methods: {
    accept() {
      const { type } = this.properties;

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
      const { type } = this.properties;

      if (type === "privacy" && resolvePrivacy)
        resolvePrivacy({ event: "disagree" });

      this.setData({ show: false });
      this.$back();
    },
  },
});
