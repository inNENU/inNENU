import { $Component } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { getCardBalance } from "./api.js";
import { getActionCookie } from "../../api/action.js";
import { type AppOption } from "../../app.js";
import { CARD_BALANCE_KEY } from "../../config/keys.js";
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
    getCardBalance(check = false) {
      if (globalData.account)
        getActionCookie(globalData.account, check).then((res) => {
          if (res.success)
            getCardBalance({ cookies: res.cookies }).then((res) => {
              if (res.success) {
                set(CARD_BALANCE_KEY, res.data, 5 * MINUTE);
                this.setData({
                  balance: res.data,
                  status: "success",
                });
              } else this.setData({ status: "error" });
            });
          else this.setData({ status: "error" });
        });
      else this.setData({ status: "login" });
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getCardBalance();
    },
  },

  externalClasses: ["custom-class"],
});
