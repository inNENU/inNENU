import { deleteSync } from "del";

deleteSync(["skyline-dist/**", "!skyline-dist/miniprogram_npm"]);
