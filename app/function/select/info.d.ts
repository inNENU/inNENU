import type { SelectInfoOptions, SelectInfoResponse } from "./typings";

export const getInfo: (
  options: SelectInfoOptions,
) => Promise<SelectInfoResponse>;
