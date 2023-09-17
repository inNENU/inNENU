import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

export interface LibraryPeopleResponse {
  benbu: number;
  benbuMax: number;
  jingyue: number;
  jingyueMax: number;
}

export const getLibraryPeople = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>(`${service}library/people`);
