import type { ProcessOptions, ProcessResponse } from "./typings.js";

export const process: (
  type: "add" | "delete",
  options: ProcessOptions,
) => Promise<ProcessResponse>;
