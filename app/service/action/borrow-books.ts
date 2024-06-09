import { logger } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { handleFailResponse } from "../fail.js";
import { LoginFailType } from "../loginFailTypes.js";
import { createService } from "../utils.js";

const BORROW_BOOKS_URL = `${ACTION_SERVER}/basicInfo/getBookBorrow`;

interface RawBorrowBookData extends Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  due_date: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  loan_date: string;
  title: string;
  author: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  publication_year: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_barcode: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  process_status: "NORMAL" | "RENEW";
  // eslint-disable-next-line @typescript-eslint/naming-convention
  location_code: {
    value: string;
    name: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_policy: {
    value: string;
    description: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  call_number: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_renew_date: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_renew_status: {
    value: string;
    desc: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  loan_status: "ACTIVE";
}

type RawBorrowBooksData =
  | {
      success: true;
      data: RawBorrowBookData[];
    }
  | {
      success: false;
      data: "";
    };

export interface BorrowBookData {
  /** 书名 */
  name: string;
  /** 作者 */
  author: string;
  /** 出版年份 */
  year: number;
  /** 借阅状态 */
  status: string;
  /** 借出时间 */
  loanDate: string;
  /** 到期时间 */
  dueDate: string;
  /** 条形码 */
  barcode: string;
  /** 位置 */
  location: string;
  /** 书架号 */
  shelfNumber: string;
  /** 是否续借 */
  renew: boolean;
  /** 续借时间 */
  renewTime?: string;
}

const getBookData = ({
  title,
  author,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  loan_date,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  due_date,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_barcode,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  location_code,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  call_number,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  process_status,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_renew_date,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_policy,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  publication_year,
}: RawBorrowBookData): BorrowBookData => ({
  name: title,
  author,
  loanDate: loan_date,
  dueDate: due_date,
  year: Number(publication_year),
  barcode: item_barcode,
  location: location_code.name,
  shelfNumber: call_number,
  renew: process_status === "RENEW",
  renewTime: last_renew_date,
  status: item_policy.description,
});

export interface BorrowBooksSuccessResponse {
  success: true;
  data: BorrowBookData[];
}

export type BorrowBooksResponse =
  | BorrowBooksSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse;

const getBorrowBooksLocal = async (): Promise<BorrowBooksResponse> => {
  const { data, status } = await request<RawBorrowBooksData>(BORROW_BOOKS_URL, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    cookieScope: ACTION_SERVER,
    redirect: "manual",
  });

  if (status === 302)
    return {
      success: false,
      type: LoginFailType.Expired,
      msg: "登录信息已过期，请重新登录",
    } as AuthLoginFailedResponse;

  if (data.success)
    return {
      success: true,
      data: data.data.map(getBookData),
    } as BorrowBooksSuccessResponse;

  return {
    success: true,
    data: [],
  } as BorrowBooksSuccessResponse;
};

const getBorrowBooksOnline = (): Promise<BorrowBooksResponse> =>
  request<BorrowBooksResponse>("/action/borrow-books", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) {
      logger.error("获取借阅书籍出错", data);

      handleFailResponse(data);
    }

    return data;
  });

export const getBorrowBooks = createService(
  "borrow-books",
  getBorrowBooksLocal,
  getBorrowBooksOnline,
);
