import { $Component, get, set } from "@mptool/all";

import { getBorrowBooks, getOnlineBorrowBooks } from "./api.js";
import type { BorrowBookData } from "./typings.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { BORROW_BOOKS_KEY } from "../../config/index.js";
import { ensureActionLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";

const { globalData, useOnlineService } = getApp<AppOption>();

$Component({
  data: {
    books: <BorrowBookData[]>[],
    status: <"loading" | "error" | "login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const books = get<BorrowBookData[]>(BORROW_BOOKS_KEY);

      if (books) this.setData({ status: "success", books });
      else this.getBooks("validate");
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getBooks("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    login() {
      this.$go("account?update=true");
    },

    async getBooks(status: "check" | "login" | "validate" = "check") {
      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        const result = await (useOnlineService("borrow-books")
          ? getOnlineBorrowBooks
          : getBorrowBooks)();

        if (result.success) {
          set(BORROW_BOOKS_KEY, result.data, 3 * HOUR);
          this.setData({ books: result.data, status: "success" });
        } else {
          this.setData({ status: "error" });
        }
      } else {
        this.setData({ status: "login" });
      }
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getBooks();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getBooks("login");
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
