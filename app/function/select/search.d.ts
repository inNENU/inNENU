import type { SearchOptions, SelectSearchResponse } from "./typings.js";

export const search: (options: SearchOptions) => Promise<SelectSearchResponse>;
