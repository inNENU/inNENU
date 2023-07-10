import {
  type BorrowBooksOptions,
  type BorrowBooksResponse,
  type LibraryPeopleResponse,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getBorrowBooks = (
  options: BorrowBooksOptions,
): Promise<BorrowBooksResponse> =>
  request<BorrowBooksResponse>(`${service}action/borrow-books`, {
    method: "POST",
    data: options,
  });

export const getLibraryPeople = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>(`${service}library/people`);
