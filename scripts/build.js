const execa = require("execa");
const fs = require("fs-extra");
const vite = require("vite");
const { createClientBuildConfig, getPath } = require("./utils");

fs.ensureDir(getPath("out"));
const build = async () => {
  // vite.build(createClientBuildConfig("epub"));
  
  const clientBuilder = execa("pnpm", ["run", "build:client"]);
  clientBuilder.stdout.pipe(process.stdout);

  const hostBuilder = execa("npm", ["run", "build:host"]);
  hostBuilder.stdout.pipe(process.stdout);
};

build();
