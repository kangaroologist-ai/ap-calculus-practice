import { defineConfig } from "vite";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import pkg from "./package.json" with { type: "json" };
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    {
      name: "local-mathlive-fonts",
      buildStart() {
        mkdirSync("public/fonts", { recursive: true });
        cpSync(
          resolve("node_modules/mathlive/fonts"),
          resolve("public/fonts"),
          { recursive: true },
        );
      },
    },
  ],
  server: { port: 5173, strictPort: true },
  build: { target: "es2022", rollupOptions: { input: { main: resolve("index.html"), help: resolve("help.html") } } },
});
