import { request } from "../../api/index.js";
import type { CommonFailedResponse } from "../utils/index.js";
import { createService } from "../utils/index.js";

interface LibraryPeopleRawData {
  code: number;
  data: {
    AbleMainNum: number;
    JingYueNum: number;
    AbleJingYueNum: number;
    MainNum: number;
  };

  status: number;
}

export interface LibraryPeopleSuccessResponse {
  success: true;
  benbu: number;
  benbuMax: number;
  jingyue: number;
  jingyueMax: number;
}

export type LibraryPeopleResponse =
  | LibraryPeopleSuccessResponse
  | CommonFailedResponse;

const getLibraryPeopleLocal = async (): Promise<LibraryPeopleResponse> => {
  const { data } = await request<LibraryPeopleRawData>(
    "https://www.library.nenu.edu.cn/engine2/custom/nenu/onlineUserNum",
  );

  if (data.code === 1 && data.status === 200) {
    const { MainNum, JingYueNum, AbleJingYueNum, AbleMainNum } = data.data;

    return {
      success: true,
      benbu: MainNum,
      benbuMax: AbleMainNum,
      jingyue: JingYueNum,
      jingyueMax: AbleJingYueNum,
    };
  }

  return {
    success: false,
    msg: "获取失败",
  };
};

const getLibraryPeopleOnline = (): Promise<LibraryPeopleResponse> =>
  request<LibraryPeopleResponse>("/library/people").then(({ data }) => data);

export const getLibraryPeople = createService(
  "library-people",
  getLibraryPeopleLocal,
  getLibraryPeopleOnline,
);
