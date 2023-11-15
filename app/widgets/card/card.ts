import { $Component, PropType, get, set } from "@mptool/all";

import { getCardBalance, getOnlineCardBalance } from "./getBalance.js";
import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { CARD_BALANCE_KEY } from "../../config/index.js";
import { ensureActionLogin } from "../../login/index.js";
import { MINUTE } from "../../utils/constant.js";
import { getSize } from "../utils.js";

const { globalData, useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
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
    status: <"loading" | "error" | "login" | "success">"loading",
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
        else this.getCardBalance("validate");
      }
    },
  },

  pageLifetimes: {
    show() {
      const { enableBalance, status } = this.data;

      if (globalData.account) {
        if (status === "login") {
          this.setData({ status: "loading" });

          if (enableBalance) this.getCardBalance("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getCardBalance(status: "check" | "login" | "validate" = "check") {
      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);
          this.setData({ status: "error" });
        } else {
          try {
            const result = await (useOnlineService("card-balance")
              ? getOnlineCardBalance
              : getCardBalance)();

            if (result.success) {
              set(CARD_BALANCE_KEY, result.data, 5 * MINUTE);
              this.setData({
                balance: result.data,
                status: "success",
              });
            } else {
              this.setData({ status: "error" });
            }
          } catch (err) {
            this.setData({ status: "error" });
          }
        }
      } else this.setData({ status: "login" });
    },

    refreshBalance() {
      this.setData({ status: "loading" });
      this.getCardBalance("login");
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