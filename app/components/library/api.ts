import { LibraryPeopleResponse } from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getLibraryPeople = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>(`${service}library/people`);
