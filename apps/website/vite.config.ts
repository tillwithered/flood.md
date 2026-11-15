import {defineConfig} from "vite";

// Lightning CSS Features.DirSelector. Direction can differ from the page language.
const dirSelector = 1 << 2;

export default defineConfig({
  css: {
    lightningcss: {
      exclude: dirSelector,
    },
  },
});
