import { type CookieOptions } from "../../../typings/cookie.js";
import { type CommonFailedResponse } from "../../../typings/response.js";
import { type AccountBasicInfo } from "../../utils/app.ts";

export type BorrowBooksOptions = AccountBasicInfo | CookieOptions;

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
  status: "success";
  data: BorrowBookData[];
}

export type BorrowBooksResponse =
  | BorrowBooksSuccessResponse
  | CommonFailedResponse;

export interface LibraryPeopleResponse {
  benbu: number;
  jingyue: number;
}
