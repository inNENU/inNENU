import { request } from "../../api/index.js";

export interface LibraryPeopleResponse {
  benbu: number;
  benbuMax: number;
  jingyue: number;
  jingyueMax: number;
}

export const getLibraryPeople = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>("/library/people").then(({ data }) => data);
