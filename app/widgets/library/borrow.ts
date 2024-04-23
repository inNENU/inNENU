import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { BORROW_BOOKS_KEY, DAY, HOUR } from "../../config/index.js";
import type { BorrowBookData } from "../../service/index.js";
import {
  ensureActionLogin,
  getBorrowBooks,
  getOnlineBorrowBooks,
} from "../../service/index.js";
import { user } from "../../state/user.js";

const { useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
    type: {
      type: String as PropType<"借阅书目 (小)" | "图书待还 (小)">,
      default: "借阅书目 (小)",
    },
  },

  data: {
    books: [] as BorrowBookData[],
    status: "loading" as "loading" | "error" | "login" | "success",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const books = get<BorrowBookData[]>(BORROW_BOOKS_KEY);

      if (books) this.setBooks(books);
      else this.getBooks("validate");

      this.setData({
        header: type.includes("借阅书目") ? "借阅书目" : "图书待还",
      });
    },
  },

  pageLifetimes: {
    show() {
      if (user.account) {
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
      if (user.account) {
        const err = await ensureActionLogin(user.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        const result = await (
          useOnlineService("borrow-books")
            ? getOnlineBorrowBooks
            : getBorrowBooks
        )();

        if (result.success) {
          set(BORROW_BOOKS_KEY, result.data, 3 * HOUR);
          this.setBooks(result.data);
        } else {
          this.setData({ status: "error" });
        }
      } else {
        this.setData({ status: "login" });
      }
    },

    setBooks(data: BorrowBookData[]) {
      const recent = data
        .map(({ dueDate }) => new Date(dueDate).getTime())
        .sort((a, b) => a - b)
        .pop();

      this.setData({
        status: "success",
        books: data,
        hasOutDated: recent ? recent < Date.now() : false,
        recent: recent ? Math.ceil((recent - Date.now()) / DAY) : null,
      });
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getBooks();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getBooks("login");
    },

    showBooks() {
      const { books } = this.data;

      if (books?.length)
        showModal(
          "借阅书目",
          books
            .map(
              ({ name, dueDate, renew, renewTime }) => `\
书名: ${name}
到期时间: ${new Date(dueDate).toLocaleString()}
是否已续借: ${renew ? "是" : "否"}
${
  renewTime
    ? `\
续借时间: ${new Date(renewTime).toLocaleString()}
`
    : ""
}\
`,
            )
            .join("\n---\n"),
        );
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
