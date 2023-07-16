import { $Component, get, set } from "@mptool/all";

import { getCardBalance } from "./api.js";
import { ensureActionLogin, showToast } from "../../api/index.js";
import { type AppOption } from "../../app.js";
import { CARD_BALANCE_KEY } from "../../config/index.js";
import { MINUTE } from "../../utils/constant.js";

const { globalData } = getApp<AppOption>();

$Component({
  data: {
    status: <"loading" | "error" | "login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const balance = get<number>(CARD_BALANCE_KEY);

      if (balance) this.setData({ status: "success", balance });
      else this.getCardBalance(true);
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getCardBalance(true);
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getCardBalance(check = false) {
      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, check);

        if (err) {
          showToast(err.msg);
          this.setData({ status: "error" });
        } else {
          try {
            const result = await getCardBalance();

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
      this.getCardBalance();
    },
  },

  externalClasses: ["custom-class"],
});
