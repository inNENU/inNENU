import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showToast } from "../../api/index.js";
import { CARD_BALANCE_KEY, MINUTE } from "../../config/index.js";
import { ensureActionLogin, getCardBalance } from "../../service/index.js";
import { user } from "../../state/index.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<
        "校园卡 (小)" | "校园卡余额 (小)" | "校园卡二维码 (小)"
      >,
      default: "校园卡 (小)",
    },
  },

  data: {
    enableBalance: false,
    enableQrcode: false,
    status: "loading" as "loading" | "error" | "login" | "success",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const balance = get<number>(CARD_BALANCE_KEY);

      const enableBalance = !type.includes("二维码");
      const enableQrcode = !type.includes("余额");

      this.setData({
        header: type.includes("未读") ? "未读邮件" : "近期邮件",
        size: getSize(type),
        enableBalance,
        enableQrcode,
      });

      if (enableBalance) {
        if (balance) this.setData({ status: "success", balance });
        else this.getCardBalance();
      }
    },
  },

  pageLifetimes: {
    show() {
      const { enableBalance, status } = this.data;

      if (!user.account) return this.setData({ status: "login" });

      if (status === "login") {
        this.setData({ status: "loading" });

        if (enableBalance) this.getCardBalance();
      }
    },
  },

  methods: {
    async getCardBalance() {
      if (!user.account) return this.setData({ status: "login" });

      this.setData({ status: "loading" });

      const err = await ensureActionLogin(user.account);

      if (err) {
        showToast(err.msg);

        return this.setData({ status: "error" });
      }

      const result = await getCardBalance();

      if (!result.success) return this.setData({ status: "error" });

      this.setData({ balance: result.data, status: "success" });
      set(CARD_BALANCE_KEY, result.data, 5 * MINUTE);
    },

    viewQrcode() {
      wx.navigateToMiniProgram({ appId: "wxd04f63577e51959e" });
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
