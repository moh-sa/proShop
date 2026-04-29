import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		build: { sourcemap: "hidden" },
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
			},
		},
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
			mkcert(),
		],
	};
});
