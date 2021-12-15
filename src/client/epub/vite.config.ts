import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import jsx from "@vitejs/plugin-vue-jsx";
import resolve from '@rollup/plugin-node-resolve';
import path from "path";
import {esbuildCommonjs} from '@originjs/vite-plugin-commonjs';
const getPath = (p: string) => path.resolve(__dirname, "../../../", p);
export default defineConfig({
  root: getPath(`src/client/epub/`),
  base: "./",
  // publicDir,
  build: {
    outDir: getPath(`out/client/epub/`),
    emptyOutDir: true,
    watch: process.env.MODE === "watch" ? {} : undefined,
    // commonjsOptions: {
    //   transformMixedEsModules: true,
    //   include: /node_modules/
    // },
  },
  optimizeDeps:{
    esbuildOptions:{
      plugins:[
        esbuildCommonjs(["epubjs"])
      ]
    }
  },
  plugins: [vue(), jsx(),
    // resolve()
  ],
  // @ts-ignore
  ssgOptions: {
    mock: true,
    entry: "index.js"
  },
  resolve: {
    // 别名
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
