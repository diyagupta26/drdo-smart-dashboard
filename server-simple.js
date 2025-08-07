import express from 'express';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    message: 'Mock login - database not connected',
    user: { id: '1', username: 'demo', role: 'user' }
  });
});

// Setup Vite for development
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: { server: httpServer } },
  root: path.resolve(__dirname, "client"),
  appType: "custom",
});

app.use(vite.middlewares);

app.use("*", async (req, res, next) => {
  try {
    const url = req.originalUrl;
    let html = fs.readFileSync(
      path.resolve(__dirname, "client/index.html"),
      "utf-8"
    );
    html = await vite.transformIndexHtml(url, html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

const port = 5000;
httpServer.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 Note: Database is not connected - this is a simplified version for testing`);
});