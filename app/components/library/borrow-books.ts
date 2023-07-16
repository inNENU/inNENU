import { $Component, get, set } from "@mptool/all";

import { getBorrowBooks } from "./api.js";
import type { BorrowBookData } from "./typings.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { BORROW_BOOKS_KEY } from "../../config/index.js";
import { ensureActionLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";

const { globalData } = getApp<AppOption>();

$Component({
  data: {
    books: <BorrowBookData[]>[],
    status: <"loading" | "error" | "login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const books = get<BorrowBookData[]>(BORROW_BOOKS_KEY);

      if (books) this.setData({ status: "success", books });
      else this.getBooks(true);
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getBooks(true);
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    login() {
      this.$go("account?update=true");
    },

    getBooks(check = false) {
      if (globalData.account)
        ensureActionLogin(globalData.account, check).then((err) => {
          if (err) {
            showToast(err.msg);
            this.setData({ status: "error" });
          } else
            getBorrowBooks().then((res) => {
              if (res.success) {
                set(BORROW_BOOKS_KEY, res.data, 3 * HOUR);
                this.setData({
                  books: res.data,
                  status: "success",
                });
              } else this.setData({ status: "error" });
            });
        });
      else this.setData({ status: "login" });
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getBooks();
    },

    viewBookDetail({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const { index } = currentTarget.dataset;

      const {
        name,
        author,
        dueDate,
        loanDate,
        location,
        shelfNumber,
        barcode,
        status,
        renew,
        renewTime,
        year,
      } = this.data.books[index];

      showModal(
        name,
        `\
作者: ${author}
出版年份: ${year}
地点: ${location}
借出状态: ${status}
借出时间: ${new Date(loanDate).toLocaleString()}
到期时间: ${new Date(dueDate).toLocaleString()}
是否已续借: ${renew ? "是" : "否"}
${
  renewTime
    ? `\
续借时间: ${new Date(renewTime).toLocaleString()}
`
    : ""
}\
条形码: ${barcode}
书架号: ${shelfNumber}
`,
      );
    },
  },

  externalClasses: ["custom-class"],
});
