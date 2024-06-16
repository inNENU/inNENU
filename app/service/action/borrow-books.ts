/* eslint-disable @typescript-eslint/naming-convention */
import { logger } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";
import {
  LoginFailType,
  createService,
  handleFailResponse,
} from "../utils/index.js";

const BORROW_BOOKS_URL = `${ACTION_SERVER}/basicInfo/getBookBorrow`;

interface RawBorrowBookData extends Record<string, unknown> {
  due_date: string;
  loan_date: string;
  title: string;
  author: string;
  publication_year: string;
  item_barcode: string;
  process_status: "NORMAL" | "RENEW";
  location_code: {
    value: string;
    name: string;
  };
  item_policy: {
    value: string;
    description: string;
  };
  call_number: string;
  last_renew_date: string;
  last_renew_status: {
    value: string;
    desc: string;
  };
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
  /** 条形码 */
  barcode: string;
  /** 借出时间 */
  loanDate: string;
  /** 到期时间 */
  dueDate: string;
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
  loan_date: loanDate,
  due_date: dueDate,
  item_barcode: barcode,
  location_code: locationCode,
  call_number: shelfNumber,
  process_status: status,
  last_renew_date: renewTime,
  item_policy: policy,
  publication_year: year,
}: RawBorrowBookData): BorrowBookData => ({
  name: title,
  author,
  loanDate,
  dueDate,
  year: Number(year),
  barcode,
  location: locationCode.name,
  shelfNumber,
  renew: status === "RENEW",
  renewTime,
  status: policy.description,
});

export type BorrowBooksSuccessResponse = CommonSuccessResponse<
  BorrowBookData[]
>;

export type BorrowBooksResponse =
  | BorrowBooksSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse;

const getBorrowBooksLocal = async (): Promise<BorrowBooksResponse> => {
  try {
    const { data, status } = await request<RawBorrowBooksData>(
      BORROW_BOOKS_URL,
      {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        cookieScope: ACTION_SERVER,
        redirect: "manual",
      },
    );

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
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
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
