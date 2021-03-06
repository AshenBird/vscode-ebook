const execa = require("execa");
const fs = require("fs-extra");
const vite = require("vite");
const { createClientBuildConfig, getPath } = require("./utils");

fs.ensureDir(getPath("out"));

const watch = async () => {
  vite.build(createClientBuildConfig("epub",{}));
  // const clientWatcher = execa("pnpm", ["run", "watch:client"]);
  // clientWatcher.stdout.pipe(process.stdout);

  const hostWatcher = execa("npm", ["run", "watch:host"]);
  hostWatcher.stdout.pipe(process.stdout);
};

watch();
