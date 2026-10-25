import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

function getApiPort() {
  let port = process.env.VITE_API_PORT || process.env.PORT;
  if (!port) {
    try {
      const serverEnv = readFileSync(new URL("../server/.env", import.meta.url), "utf8");
      port = serverEnv.match(/^\s*PORT\s*=\s*["']?([0-9]+)["']?\s*(?:#.*)?$/m)?.[1];
    } catch {
      // The server can still use the documented default port.
    }
  }

  const parsedPort = Number(port);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
}

const apiTarget = process.env.VITE_API_PROXY_TARGET || `http://localhost:${getApiPort()}`;

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
