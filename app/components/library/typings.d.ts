import type { CommonFailedResponse } from "../../../typings/response.js";
import type { AuthLoginFailedResponse } from "../../login/typings.js";

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
