import { deleteSync } from "del";

deleteSync([".temp/**", "dist/**", "!dist/miniprogram_npm"]);
