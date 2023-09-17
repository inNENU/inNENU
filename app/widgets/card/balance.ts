import { $Component, get, set } from "@mptool/all";

import { getCardBalance, getOnlineCardBalance } from "./getBalance.js";
import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { CARD_BALANCE_KEY } from "../../config/index.js";
import { ensureActionLogin } from "../../login/index.js";
import { MINUTE } from "../../utils/constant.js";

const { globalData, useOnlineService } = getApp<AppOption>();

$Component({
  data: {
    status: <"loading" | "error" | "login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const balance = get<number>(CARD_BALANCE_KEY);

      if (balance) this.setData({ status: "success", balance });
      else this.getCardBalance("validate");
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getCardBalance("validate");
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

    refresh() {
      this.setData({ status: "loading" });
      this.getCardBalance("login");
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});