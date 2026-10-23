import { defineConfig } from "astro/config";
import { wgslVitePlugin } from "@vgpu/wgsl/loader-vite";

export default defineConfig({
  vite: {
    plugins: [wgslVitePlugin()],
  },
});
