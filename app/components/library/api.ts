import { logger } from "@mptool/all";

import {
  type BorrowBooksResponse,
  type LibraryPeopleResponse,
} from "./typings.js";
import { ACTION_SERVER } from "../../api/login/action.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

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
