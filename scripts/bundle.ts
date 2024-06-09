import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import commonjs from "@rollup/plugin-commonjs";
import type { Options } from "rollup-plugin-esbuild";
import esbuild from "rollup-plugin-esbuild";
import { rollup } from "rollup";
// @ts-expect-error: tsconfig is not correct
import tsconfig from "../tsconfig.json";

// @ts-expect-error: tsconfig is not correct
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));

const getInputOptions = (dir: string): [string, string][] => {
  const dirPath = resolve(__dirname, "../temp/", dir);

  if (!existsSync(dirPath)) return [];

  const contents = readdirSync(dirPath);
  const dirs = contents.filter((content) =>
    statSync(resolve(__dirname, "../temp/", dir, content)).isDirectory(),
  );
  const files = contents.filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
  );

  return [
    ...dirs.flatMap((subDir) => getInputOptions(join(dir, subDir))),
    ...files.map<[string, string]>((file) => [
      join(dir, file.split(".")[0]).replaceAll(sep, "/"),
      resolve(__dirname, "../temp/", dir, file),
    ]),
  ];
};

const base = getInputOptions("base");
const components = getInputOptions("components");
const functionPages = getInputOptions("function").filter(
  ([name]) => !name.includes("/utils/"),
);
const pages = getInputOptions("pages");
const widgets = getInputOptions("widgets");

// repack miniapp
rollup({
  input: {
    app: resolve(__dirname, `../temp/app.ts`),
    ...Object.fromEntries(base),
    ...Object.fromEntries(components),
    ...Object.fromEntries(widgets),
    ...Object.fromEntries(pages),
    ...Object.fromEntries(functionPages),
  },

  plugins: [
    commonjs(),
    esbuild({
      charset: "utf8",
      target: "es2017",
      tsconfigRaw: {
        ...tsconfig,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        compilerOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ...tsconfig.compilerOptions,
        },
      } as Options["tsconfigRaw"],
      minify: true,
    }),
  ],
  treeshake: {
    moduleSideEffects: false,
  },
  external: ["@mptool/all", "tslib"],
}).then((bundle) =>
  bundle.write({
    dir: resolve(__dirname, "../dist"),
    format: "cjs",
    sourcemap: true,
    chunkFileNames: "[name].js",
    entryFileNames: "[name].js",

    // this ensures that require files are generated
    manualChunks: (id): string | void => {
      const normalizedId = sep === "/" ? id : id.replace(/\\/g, "/");

      if (normalizedId.includes("/temp/app.ts")) return "app";

      for (const name of [
        "api",
        "config",
        "mixins",
        "service",
        "function/utils",
      ]) {
        if (normalizedId.includes(`/temp/${name}/index.ts`))
          return `${name}/index`;
      }
    },
  }),
);
