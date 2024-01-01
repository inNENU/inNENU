import { request } from "../../../api/index.js";

export const MAIN_URL = "https://www.nenu.edu.cn";

export const getPageView = (
  id: string | number,
  owner: string | number,
): Promise<number> =>
  request<string>(
    `${MAIN_URL}/system/resource/code/news/click/dynclicks.jsp?clickid=${id}&owner=${owner}&clicktype=wbnews`,
  ).then(({ data }) => Number(data));
