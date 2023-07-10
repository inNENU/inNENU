import { $Component } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { getBorrowBooks } from "./api.js";
import { type BorrowBookData } from "./typings.js";
import { actionLogin } from "../../api/login.js";
import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { BORROW_BOOKS_KEY } from "../../config/keys.js";
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

      if (books) this.setData({ loading: false, books });
      else this.getBooks();
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getBooks();
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    login() {
      this.$go("account?update=true");
    },

    getBooks() {
      if (globalData.account)
        actionLogin(globalData.account).then((res) => {
          if (res.status === "success")
            getBorrowBooks({ cookies: res.cookies }).then((res) => {
              if (res.status === "success") {
                set(BORROW_BOOKS_KEY, res.data, 3 * HOUR);
                this.setData({ books: res.data, status: "success" });
              } else this.setData({ status: "error" });
            });
          else this.setData({ status: "error" });
        });
      else this.setData({ status: "login" });
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
