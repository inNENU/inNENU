const { existsSync } = require("node:fs");
const { parse, resolve } = require("node:path");
const { sass } = require("@mr-hope/gulp-sass");
const { dest, parallel, src, watch, lastRun } = require("gulp");
const rename = require("gulp-rename");
const typescript = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");

const tsProject = typescript.createProject("tsconfig.json");

const getScriptJob = (id) => {
  const script = () =>
    src(["app/**/*.ts", "typings/**/*.ts"], {
      read: (value) => {
        const name = parse(value.path).name.replace(/\.d$/, "");

        if (name.includes(".")) return name.endsWith(`.${id}`);

        return !existsSync(
          resolve("app", value.path).replace(/\.ts$/, `.${id}.ts`),
        );
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(`.${id}`))
            path.basename = path.basename.replace(new RegExp(`\\.${id}$`), "");
        }),
      )
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write(".", { includeContent: true }))
      .pipe(dest("dist"));

  return script;
};

const getStyleJob = (id, ext = "wxss") => {
  const style = () =>
    src("app/**/*.scss", {
      read: (value) => {
        const { name } = parse(value.path);

        if (name.includes(".")) return name.endsWith(`.${id}`);

        return !existsSync(
          resolve("app", value.path).replace(/\.scss$/, `.${id}.scss`),
        );
      },
    })
      .pipe(
        rename((path) => {
          if (path.basename.endsWith(`.${id}`))
            path.basename = path.basename.replace(new RegExp(`\\.${id}$`), "");
        }),
      )
      .pipe(
        sass({
          style: "compressed",
          importers: [
            // preserve `@import` rules
            {
              canonicalize: (url, { fromImport }) =>
                fromImport
                  ? new URL(
                      `miniapp:import?path=${url.replace(/^import:/, "")}`,
                    )
                  : null,
              load: (canonicalUrl) => ({
                contents: `@import "${canonicalUrl.searchParams.get(
                  "path",
                )}.${ext}"`,
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

const getAssetsJob = (id) => {
  const assetsJob = () =>
    src("app/**/*.{json,svg,png,webp}", {
      read: (value) => {
        const { name, ext } = parse(value.path);

        if (name.includes("app.miniapp")) return true;

        if (name.includes(".")) return name.endsWith(`.${id}`);

        return !existsSync(
          resolve("app", value.path).replace(new RegExp(ext), `.${id}${ext}`),
        );
      },
      since: lastRun(assetsJob),
    })
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
    src(`project.config.${id}.json`)
      .pipe(rename("project.config.json"))
      .pipe(dest("."));

  return configJob;
};

/* App */
const buildAppScript = getScriptJob("app");
const watchAppScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildAppScript);

const buildAppWXSS = getStyleJob("app");
const watchAppWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildAppWXSS);

const moveAppAssets = getAssetsJob("app");
const watchAppAssets = () =>
  watch(
    "app/**/*.{json,svg,png,webp}",
    { ignoreInitial: false },
    moveAppAssets,
  );

const moveAppFiles = () =>
  src("app/**/*.{wxml,wxs}", {
    read: (value) => {
      const { name, ext } = parse(value.path);

      if (name.includes(".")) return name.endsWith(".wx");

      return !existsSync(
        resolve("app", value.path).replace(new RegExp(ext), `.wx${ext}`),
      );
    },
    since: lastRun(moveAppFiles),
  })
    .pipe(
      rename((path) => {
        if (path.basename.endsWith(".wx"))
          path.basename = path.basename.replace(/\.wx$/, "");
      }),
    )
    .pipe(dest("dist"));

const watchAppFiles = () =>
  watch("app/**/*.{wxml,wxs}", { ignoreInitial: false }, moveAppFiles);

const watchApp = parallel(
  watchAppScript,
  watchAppWXSS,
  watchAppAssets,
  watchAppFiles,
  getConfigJob("app"),
);
const buildApp = parallel(
  buildAppWXSS,
  buildAppScript,
  moveAppAssets,
  moveAppFiles,
  getConfigJob("app"),
);

/* Wechat */
const buildWechatScript = getScriptJob("wx");
const watchWechatScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildWechatScript);

const buildWechatWXSS = getStyleJob("wx");
const watchWechatWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildWechatWXSS);

const moveWechatAssets = getAssetsJob("wx");
const watchWechatAssets = () =>
  watch(
    "app/**/*.{json,svg,png,webp}",
    { ignoreInitial: false },
    moveWechatAssets,
  );

const moveWechatFiles = () =>
  src("app/**/*.{wxml,wxs}", {
    read: (value) => {
      const { name, ext } = parse(value.path);

      if (name.includes(".")) return name.endsWith(".wx");

      return !existsSync(
        resolve("app", value.path).replace(new RegExp(ext), `.wx${ext}`),
      );
    },
    since: lastRun(moveWechatFiles),
  })
    .pipe(
      rename((path) => {
        if (path.basename.endsWith(".wx"))
          path.basename = path.basename.replace(/\.wx$/, "");
      }),
    )
    .pipe(dest("dist"));

const watchWechatFiles = () =>
  watch("app/**/*.{wxml,wxs}", { ignoreInitial: false }, moveWechatFiles);

const watchWechat = parallel(
  watchWechatScript,
  watchWechatWXSS,
  watchWechatAssets,
  watchWechatFiles,
  getConfigJob("wx"),
);
const buildWechat = parallel(
  buildWechatWXSS,
  buildWechatScript,
  moveWechatAssets,
  moveWechatFiles,
  getConfigJob("wx"),
);

/* Nenuyouth, marked as qy */

const buildNenuyouthScript = getScriptJob("qy");
const watchNenuyouthScript = () =>
  watch(
    "{app,typings}/**/*.ts",
    { ignoreInitial: false },
    buildNenuyouthScript,
  );

const buildNenuyouthWXSS = getStyleJob("qy");
const watchNenuyouthWXSS = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildNenuyouthWXSS);

const moveNenuyouthAssets = getAssetsJob("qy");
const watchNenuyouthAssets = () =>
  watch(
    "app/**/*.{json,svg,png,webp}",
    { ignoreInitial: false },
    moveNenuyouthAssets,
  );

const moveNenuyouthFiles = () =>
  src("app/**/*.{wxml,wxs}", {
    read: (value) => {
      const { name, ext } = parse(value.path);

      if (name.includes(".")) return name.endsWith(".qy");

      return !existsSync(
        resolve("app", value.path).replace(new RegExp(ext), `.qy${ext}`),
      );
    },
    since: lastRun(moveNenuyouthFiles),
  })
    .pipe(
      rename((path) => {
        if (path.basename.endsWith(".qy"))
          path.basename = path.basename.replace(/\.qy$/, "");
      }),
    )
    .pipe(dest("dist"));

const watchNenuyouthFiles = () =>
  watch("app/**/*.{wxml,wxs}", { ignoreInitial: false }, moveNenuyouthFiles);

const watchNenuyouth = parallel(
  watchNenuyouthScript,
  watchNenuyouthWXSS,
  watchNenuyouthAssets,
  watchNenuyouthFiles,
  getConfigJob("qy"),
);
const buildNenuyouth = parallel(
  buildNenuyouthWXSS,
  buildNenuyouthScript,
  moveNenuyouthAssets,
  moveNenuyouthFiles,
  getConfigJob("qy"),
);

/* QQ */

const buildQQScript = getScriptJob("qq");
const watchQQScript = () =>
  watch("{app,typings}/**/*.ts", { ignoreInitial: false }, buildQQScript);

const buildQss = getStyleJob("qq");
const watchQss = () =>
  watch("app/**/*.scss", { ignoreInitial: false }, buildQss);

const moveQQAssets = getAssetsJob("qq");
const watchQQAssets = () =>
  watch("app/**/*.{json,svg,png,webp}", { ignoreInitial: false }, moveQQAssets);

const moveQQFiles = () =>
  src("app/**/*.{wxml,wxs,qml,qs}", {
    read: (value) => {
      const { name, ext } = parse(value.path);

      if (name.includes(".")) return name.endsWith(".qq");

      if (
        ext === "wxml" &&
        existsSync(resolve("app", value.path).replace(/\.wxml$/, `.qml`))
      )
        return false;

      if (
        ext === "wxs" &&
        existsSync(resolve("app", value.path).replace(/\.wxs$/, `.qs`))
      )
        return false;

      if (
        existsSync(
          resolve("app", value.path).replace(new RegExp(ext), `.qq${ext}`),
        )
      )
        return false;

      return true;
    },
    since: lastRun(moveQQFiles),
  })
    .pipe(
      rename((path) => {
        if (path.basename.endsWith(".qq"))
          path.basename = path.basename.replace(/\.qq$/, "");
        else if (path.extname === ".qs") path.extname = ".wxs";
        else if (path.extname === ".qml") path.extname = ".wxml";
      }),
    )
    .pipe(dest("dist"));

const watchQQFiles = () =>
  watch("app/**/*.{wxml,wxs,qml,qs}", { ignoreInitial: false }, moveQQFiles);

const watchQQ = parallel(
  watchQQScript,
  watchQss,
  watchQQAssets,
  watchQQFiles,
  getConfigJob("qq"),
);
const buildQQ = parallel(
  buildQss,
  buildQQScript,
  moveQQAssets,
  moveQQFiles,
  getConfigJob("qq"),
);

/* exports */

exports.default = buildWechat;

exports.watchApp = watchApp;
exports.buildApp = buildApp;

exports.watchWechat = watchWechat;
exports.buildWechat = buildWechat;

exports.watchNenuyouth = watchNenuyouth;
exports.buildNenuyouth = buildNenuyouth;

exports.watchQQ = watchQQ;
exports.buildQQ = buildQQ;
