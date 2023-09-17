import { logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import type { AuthLoginFailedResponse } from "../../login/index.js";
import { ACTION_SERVER, handleFailResponse } from "../../login/index.js";

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

export type RawBorrowBooksData =
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

export interface BorrowBooksSuccessResponse {
  success: true;
  data: BorrowBookData[];
}

export type BorrowBooksResponse =
  | BorrowBooksSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse;

const BORROW_BOOKS_URL = `${ACTION_SERVER}/basicInfo/getBookBorrow`;

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

export const getBorrowBooks = async (): Promise<BorrowBooksResponse> => {
  const data = await request<RawBorrowBooksData>(BORROW_BOOKS_URL, {
    header: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    scope: ACTION_SERVER,
  });

  if (data.success)
    return <BorrowBooksSuccessResponse>{
      success: true,
      data: data.data.map(getBookData),
    };

  return <BorrowBooksSuccessResponse>{
    success: true,
    data: [],
  };
};

export const getOnlineBorrowBooks = (): Promise<BorrowBooksResponse> =>
  request<BorrowBooksResponse>(`${service}action/borrow-books`, {
    method: "POST",
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) {
      logger.error("获取校园卡余额出错", data);

      handleFailResponse(data);
    }

    return data;
  });
