import { Express } from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, httpServer: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server: httpServer } },
    configFile: path.resolve(__dirname, "../vite.config.ts"),
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let html = fs.readFileSync(
        path.resolve(__dirname, "../client/index.html"),
        "utf-8"
      );
      html = await vite.transformIndexHtml(url, html);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const dist = path.resolve(__dirname, "../client/dist");
  app.use(require("express").static(dist));
  app.get("*", (_, res) => {
    res.sendFile(path.resolve(dist, "index.html"));
  });
}

export function log(message: string) {
  console.log(`[server] ${message}`);
}
