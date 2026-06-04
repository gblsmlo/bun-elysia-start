import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import babel from "vite-plugin-babel";

// @vitejs/plugin-react v6 is oxc-based and drops the `babel` option, but the
// React Compiler only ships as a Babel plugin. Run it as a `pre` pass so the
// compiler sees JSX before oxc transforms it.
const reactCompiler = {
  ...babel({
    include: /\.[jt]sx?$/,
    exclude: /node_modules/,
    babelConfig: {
      babelrc: false,
      configFile: false,
      presets: ["@babel/preset-typescript"],
      plugins: [["babel-plugin-react-compiler", {}]],
    },
  }),
  enforce: "pre" as const,
};

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    reactCompiler,
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
});
