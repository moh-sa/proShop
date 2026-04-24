import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: { sourcemap: "hidden" },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      sentryVitePlugin({
        org: "self-yki",
        project: "proshop-client",
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: [
            "./**/*.map",
            ".*/**/public/**/*.map",
            "./dist/**/client/**/*.map",
          ],
        },
      }),
    ],
  };
});
