import { deleteSync } from "del";

deleteSync(["dist/**", "!dist/miniprogram_npm"]);
