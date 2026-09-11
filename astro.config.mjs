import { defineConfig } from "astro/config";

// Static site for aiwithui.net, deployed on Cloudflare Pages.
export default defineConfig({
  site: "https://aiwithui.net",
  build: { format: "directory" },
});
