import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";

// @ts-expect-error: tsconfig is not correct
const __dirname = dirname(fileURLToPath(import.meta.url));

const getInputOptions = (dir: string): [string, string][] => {
  const dirPath = resolve(__dirname, "../.temp/", dir);

  if (!existsSync(dirPath)) return [];

  const contents = readdirSync(dirPath);
  const dirs = contents.filter((content) =>
    statSync(resolve(__dirname, "../.temp/", dir, content)).isDirectory(),
  );
  const files = contents.filter(
    (file) =>
      (file.endsWith(".ts") && !file.endsWith(".d.ts")) || file.endsWith(".js"),
  );

  return [
    ...dirs.flatMap((subDir) => getInputOptions(join(dir, subDir))),
    ...files.map<[string, string]>((file) => [
      join(dir, file.split(".")[0]).replaceAll(sep, "/"),
      resolve(__dirname, "../.temp/", dir, file),
    ]),
  ];
};

const base = getInputOptions("base");
const components = getInputOptions("components");
const pages = getInputOptions("pages");
const widgets = getInputOptions("widgets");
const addonPages = getInputOptions("pkg/addon/pages");
const toolComponents = getInputOptions("pkg/tool/components");
const toolPages = getInputOptions("pkg/tool/pages");
const userPages = getInputOptions("pkg/user/pages");

// repack miniapp
void rollup({
  input: {
    app: resolve(__dirname, `../.temp/app.ts`),
    ...Object.fromEntries(base),
    ...Object.fromEntries(components),
    ...Object.fromEntries(widgets),
    ...Object.fromEntries(pages),
    ...Object.fromEntries(addonPages),
    ...Object.fromEntries(toolComponents),
    ...Object.fromEntries(toolPages),
    ...Object.fromEntries(userPages),
  },

  plugins: [
    esbuild({
      charset: "utf8",
      target: "es2017",
      tsconfig: resolve(__dirname, "../tsconfig.build.json"),
      minify: true,
    }),
  ],
  treeshake: {
    manualPureFunctions: ["createService"],
    preset: "smallest",
  },
  external: ["@mptool/all"],
  preserveEntrySignatures: false,

  strictDeprecations: true,
}).then((bundle) =>
  bundle.write({
    dir: resolve(__dirname, "../dist"),
    format: "cjs",
    sourcemap: true,
    chunkFileNames: "[name].js",
    entryFileNames: "[name].js",
    generatedCode: {
      arrowFunctions: true,
      constBindings: true,
      objectShorthand: true,
      preset: "es2015",
    },
    strict: false,

    // this ensures that require files are generated
    manualChunks: (id): string | void => {
      const normalizedId = sep === "/" ? id : id.replace(/\\/g, "/");

      for (const name of [
        "api",
        "app",
        "config",
        "mixins",
        "service",
        "state",
        "utils",
        "pkg/addon/service",
        "pkg/addon/utils",
        "pkg/tool/service",
        "pkg/tool/utils",
        "pkg/user/service",
        "pkg/user/utils",
      ]) {
        if (normalizedId.includes(`/.temp/${name}/index.ts`))
          return `${name}/index`;
      }

      if (normalizedId.includes("/.temp/app.ts")) return "app";
    },
  }),
);
