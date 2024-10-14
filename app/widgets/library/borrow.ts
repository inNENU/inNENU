import type { PropType } from "@mptool/all";
import { $Component, get, set, showModal } from "@mptool/all";

import { BORROW_BOOKS_KEY, DAY, HOUR } from "../../config/index.js";
import type { BorrowBookData } from "../../service/index.js";
import { getBorrowBooks } from "../../service/index.js";
import { user } from "../../state/index.js";

$Component({
  props: {
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
    attached(): void {
      const { type } = this.data;
      const books = get<BorrowBookData[]>(BORROW_BOOKS_KEY);

      if (books) this.setBooks(books);
      else this.getBooks();

      this.setData({
        header: type.includes("借阅书目") ? "借阅书目" : "图书待还",
      });
    },
  },

  pageLifetimes: {
    show(): void {
      if (!user.account) return this.setData({ status: "login" });

      if (this.data.status === "login") {
        this.setData({ status: "loading" });
        this.getBooks();
      }
    },
  },

  methods: {
    login() {
      this.$go("account-login?update=true");
    },

    async getBooks() {
      if (!user.account) return this.setData({ status: "login" });

      const result = await getBorrowBooks();

      if (!result.success)
        return this.setData({ status: "error", errMsg: result.msg });

      this.setBooks(result.data);
      set(BORROW_BOOKS_KEY, result.data, 3 * HOUR);
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
