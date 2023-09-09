import type { StudentAmountOptions, StudentAmountResponse } from "./typings";

export const getAmount: (
  options: StudentAmountOptions,
) => Promise<StudentAmountResponse>;
