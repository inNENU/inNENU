import { logger } from "@mptool/all";

import type {
  BorrowBookData,
  BorrowBooksResponse,
  BorrowBooksSuccessResponse,
  RawBorrowBookData,
  RawBorrowBooksData,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { ACTION_SERVER, handleFailResponse } from "../../login/index.js";

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
