const { existsSync } = require("node:fs");
const { parse, resolve } = require("node:path");

const { dest, parallel, src, watch, lastRun } = require("gulp");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const sourcemaps = require("gulp-sourcemaps");
const typescript = require("gulp-typescript");
const { sass } = require("gulp5-sass-plugin");

const tsProject = typescript.createProject("tsconfig.gulp.json");

const getScriptJob = (id) => {
  const suffix = `.${id}`;
  const suffixRegExp = new RegExp(`\\.${id}$`);

  const script = () =>
    src(["app/**/*.ts", "typings/**/*.ts"], {
      read: (value) => {
        const name = parse(value.path).name.replace(/\.d$/, "");

        if (name.includes(".")) return name.endsWith(suffix);

        return !existsSync(resolve("app", value.path).replace(/\.ts$/, `.${id}.ts`));
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(suffix))
            path.basename = path.basename.replace(suffixRegExp, "");
        }),
      )
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write(".", { includeContent: true }))
      .pipe(
        replace(
          '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n',
          "",
        ),
      )
      .pipe(dest("dist"));

  return script;
};

const getMoveScriptJob = (id) => {
  const moveScript = () =>
    src(["app/**/*.ts", "app/**/*.js"], {
      read: (value) => {
        if ([`.${id}.ts`, ".d.ts", ".js"].some((ext) => value.path.endsWith(ext))) return true;

        return (
          !existsSync(resolve("app", `${value.path.slice(0, -3)}.${id}.ts`)) &&
          value.path.split(".").length === 2
        );
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(`.${id}`))
            path.basename = path.basename.slice(0, -id.length - 1);
        }),
      )
      .pipe(dest(".temp"));

  return moveScript;
};

const getStyleJob = (id, ext = "wxss") => {
  const suffix = `.${id}`;
  const suffixRegExp = new RegExp(`\\.${id}$`);

  const style = () =>
    src("app/**/*.scss", {
      read: (value) => {
        const { name } = parse(value.path);

        if (name.includes(".")) return name.endsWith(suffix);

        return !existsSync(resolve("app", value.path).replace(/\.scss$/, `.${id}.scss`));
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(suffix))
            path.basename = path.basename.replace(suffixRegExp, "");
        }),
      )
      .pipe(
        sass({
          style: "compressed",
          silenceDeprecations: ["import"],
          importers: [
            // preserve `@import` rules
            {
              canonicalize: (url, { fromImport }) =>
                fromImport ? new URL(`miniapp:import?path=${url.replace(/^import:/, "")}`) : null,
              load: (canonicalUrl) => ({
                contents: `@import "${canonicalUrl.searchParams.get("path")}.${ext}"`,
                syntax: "css",
              }),
            },
          ],
        }).on("error", sass.logError),
      )
      .pipe(rename({ extname: `.${ext}` }))
      .pipe(dest("dist"));

  return style;
};

const getAssetsJob = (id, { bundle = false, wxFiles = true } = {}) => {
  const assetsJob = () =>
    src(
      [
        "app/**/*.{json,svg,png,webp}",
        ...(wxFiles ? ["app/**/*.{wxml,wxs}"] : []),
        ...(bundle ? [] : ["app/**/*.{js,map}"]),
      ],
      {
        encoding: false,
        read: (value) => {
          const { name, ext } = parse(value.path);

          if (name.includes("app.miniapp") || ext === ".map") return true;

          if (name.includes(".")) return name.endsWith(`.${id}`);

          return !existsSync(resolve("app", value.path).replace(new RegExp(ext), `.${id}${ext}`));
        },
        since: lastRun(assetsJob),
      },
    )
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(`.${id}`))
            path.basename = path.basename.replace(new RegExp(`\\.${id}$`), "");
        }),
      )
      .pipe(dest("dist"));

  return assetsJob;
};

const getConfigJob = (id) => {
  const configJob = () =>
    src(`project.config.${id}.json`).pipe(rename("project.config.json")).pipe(dest("."));

  return configJob;
};

/* App */
const buildAppScript = getScriptJob("app");
const watchAppScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildAppScript);

const buildAppWxss = getStyleJob("app");
const watchAppWxss = () => watch("app/**/*.scss", { ignoreInitial: false }, buildAppWxss);

const moveAppAssets = getAssetsJob("app");
const watchAppAssets = () =>
  watch(
    ["app/**/*.{json,svg,png,webp}", "app/**/*.{wxml,wxs}"],
    { ignoreInitial: false },
    moveAppAssets,
  );

const moveAppConfig = getConfigJob("app");
const watchAppConfig = () =>
  watch("project.config.app.json", { ignoreInitial: false }, moveAppConfig);

const watchApp = parallel(watchAppScript, watchAppWxss, watchAppAssets, watchAppConfig);
const buildApp = parallel(buildAppWxss, buildAppScript, moveAppAssets, moveAppConfig);
const bundleApp = parallel(
  buildAppWxss,
  getAssetsJob("app", { bundle: true }),
  getMoveScriptJob("app"),
  moveAppConfig,
);

/* Wechat */
const buildWechatScript = getScriptJob("wx");
const watchWechatScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildWechatScript);

const buildWechatWxss = getStyleJob("wx");
const watchWechatWxss = () => watch("app/**/*.scss", { ignoreInitial: false }, buildWechatWxss);

const moveWechatAssets = getAssetsJob("wx");
const watchWechatAssets = () =>
  watch(
    ["app/**/*.{json,svg,png,webp}", "app/**/*.{wxml,wxs}"],
    { ignoreInitial: false },
    moveWechatAssets,
  );

const moveWechatConfig = getConfigJob("wx");
const watchWechatConfig = () =>
  watch("project.config.wx.json", { ignoreInitial: false }, moveWechatConfig);

const watchWechat = parallel(
  watchWechatScript,
  watchWechatWxss,
  watchWechatAssets,
  watchWechatConfig,
);
const buildWechat = parallel(
  buildWechatWxss,
  buildWechatScript,
  getAssetsJob("wx"),
  moveWechatConfig,
);
const bundleWechat = parallel(
  buildWechatWxss,
  getAssetsJob("wx", { bundle: true }),
  getMoveScriptJob("wx"),
  moveWechatConfig,
);

/* weNENU, marked as we */

const buildWeNENUScript = getScriptJob("we");
const watchWeNENUScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildWeNENUScript);

const buildWeNENUWxss = getStyleJob("we");
const watchWeNENUWxss = () => watch("app/**/*.scss", { ignoreInitial: false }, buildWeNENUWxss);

const moveWeNENUAssets = getAssetsJob("we");
const watchWeNENUAssets = () =>
  watch(
    ["app/**/*.{json,svg,png,webp}", "app/**/*.{wxml,wxs}"],
    { ignoreInitial: false },
    moveWeNENUAssets,
  );

const moveWeNENUConfig = getConfigJob("we");
const watchWeNENUConfig = () =>
  watch("project.config.we.json", { ignoreInitial: false }, moveWeNENUConfig);

const watchWeNENU = parallel(
  watchWeNENUScript,
  watchWeNENUWxss,
  watchWeNENUAssets,
  watchWeNENUConfig,
);
const buildWeNENU = parallel(
  buildWeNENUWxss,
  buildWeNENUScript,
  moveWeNENUAssets,
  moveWeNENUConfig,
);
const bundleWeNENU = parallel(
  buildWeNENUWxss,
  getAssetsJob("we", { bundle: true }),
  getMoveScriptJob("we"),
  moveWeNENUConfig,
);

/* debug wechat with local server */

const getDebugMoveScriptJob = (id) => {
  const moveScript = () =>
    src(["app/**/*.ts", "app/**/*.js"], {
      read: (value) => {
        if ([`.${id}.ts`, ".d.ts", ".js"].some((ext) => value.path.endsWith(ext))) return true;

        return (
          !existsSync(resolve("app", `${value.path.slice(0, -3)}.${id}.ts`)) &&
          value.path.split(".").length === 2
        );
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(`.${id}`))
            path.basename = path.basename.slice(0, path.basename.length - id.length - 1);
        }),
      )
      .pipe(
        replace(
          /export const assets = "https:\/\/assets\.innenu\.com\/";/,
          'export const assets = "http://localhost:4040/";',
        ),
      )
      .pipe(
        replace(
          /export const server = "https:\/\/res\.innenu\.com\/";/,
          'export const server = "http://localhost:4040/";',
        ),
      )
      .pipe(dest(".temp"));

  return moveScript;
};

const debugWechat = parallel(
  buildWechatWxss,
  getAssetsJob("wx", { bundle: true }),
  getDebugMoveScriptJob("wx"),
  moveWechatConfig,
);

/* exports */

exports.default = buildWechat;

exports.watchApp = watchApp;
exports.buildApp = buildApp;
exports.bundleApp = bundleApp;

exports.watchWechat = watchWechat;
exports.buildWechat = buildWechat;
exports.bundleWechat = bundleWechat;
exports.debugWechat = debugWechat;

exports.watchWeNENU = watchWeNENU;
exports.buildWeNENU = buildWeNENU;
exports.bundleWeNENU = bundleWeNENU;
