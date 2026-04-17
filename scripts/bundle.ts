import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

import { build } from "tsdown";

const __dirname = import.meta.dirname;

const getInputOptions = (dir: string): [string, string][] => {
  const dirPath = resolve(__dirname, "../.temp/", dir);

  if (!existsSync(dirPath)) return [];

  const contents = readdirSync(dirPath);
  const dirs = contents.filter((content) =>
    statSync(resolve(__dirname, "../.temp/", dir, content)).isDirectory(),
  );
  const files = contents.filter(
    (file) => (file.endsWith(".ts") && !file.endsWith(".d.ts")) || file.endsWith(".js"),
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

const entry = {
  app: resolve(__dirname, `../.temp/app.ts`),
  ...Object.fromEntries(base),
  ...Object.fromEntries(components),
  ...Object.fromEntries(widgets),
  ...Object.fromEntries(pages),
  ...Object.fromEntries(addonPages),
  ...Object.fromEntries(toolComponents),
  ...Object.fromEntries(toolPages),
  ...Object.fromEntries(userPages),
};

console.log(entry);

// repack miniapp
await build({
  clean: false,
  entry,

  platform: "browser",
  format: "cjs",
  target: "es2017",
  fixedExtension: false,

  minify: true,

  outputOptions: {
    chunkFileNames: "[name].js",
    entryFileNames: "[name].js",
    codeSplitting: {
      groups: [
        {
          test: `/.temp/app.ts`,
          name: "app",
        },
        ...[
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
        ].map((name) => ({ test: `/.temp/${name}`, name: `${name}/index` })),
      ],
    },
    generatedCode: {
      preset: "es2015",
    },
  },

  treeshake: {
    manualPureFunctions: ["createService"],
  },

  deps: {
    neverBundle: ["@mptool/all"],
  },
});
