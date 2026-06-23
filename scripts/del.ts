import { deleteAsync } from "del";

await deleteAsync([".temp/**", "dist/**", "!dist/miniprogram_npm"]);
