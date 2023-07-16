import { logger } from "@mptool/all";

import type { BorrowBooksResponse, LibraryPeopleResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { ACTION_SERVER } from "../../login/index.js";

export const getBorrowBooks = (): Promise<BorrowBooksResponse> =>
  request<BorrowBooksResponse>(`${service}action/borrow-books`, {
    method: "POST",
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取校园卡余额出错", data);

    return data;
  });

export const getLibraryPeople = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>(`${service}library/people`);
