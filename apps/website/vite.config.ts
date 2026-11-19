import {defineConfig} from "vite";

// Lightning CSS Features.DirSelector. Direction can differ from the page language.
const dirSelector = 1 << 2;

export default defineConfig({
  define: { __FLOOD_PUBLIC_SITE__: JSON.stringify(process.env.FLOOD_WEBSITE_PROFILE === "public") },
  css: {
    lightningcss: {
      exclude: dirSelector,
    },
  },
});
