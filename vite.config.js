import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the build portable (works on GitHub Pages subpaths and locally)
export default defineConfig({
  plugins: [react()],
  base: "./",
  // allow serving through directory junctions/symlinks in dev;
  // proxy API calls to the local wrangler dev server
  server: {
    fs: { strict: false },
    proxy: { "/api": "http://localhost:8787" },
  },
});
