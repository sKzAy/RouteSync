import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { matchesRouter } from "./apiHandler";

const app = express();

// Trust Vercel's edge proxy headers so req.ip and express-rate-limit work reliably
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Normalize incoming paths for Vercel serverless function invocations
app.use((req, _res, next) => {
  const vercelMatchedPath = req.headers["x-matched-path"] as string | undefined;
  if (vercelMatchedPath && vercelMatchedPath.startsWith("/api") && req.url === "/api") {
    req.url = vercelMatchedPath;
  }
  if (!req.url.startsWith("/api") && !req.url.startsWith("/health") && req.url !== "/") {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});

app.get(["/", "/api", "/health", "/api/health"], (_req, res) => {
  res.json({ status: "ok", service: "RouteSync API" });
});

// Generous default: 2000 requests / 15 min per IP in dev so continuous polling
// (notifications, consents, chats) doesn't prematurely throttle localhost.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "production" ? 200 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false },
  })
);

app.use(matchesRouter);

// Vercel imports this module as a serverless function. Keep the listener for
// local development, but never start a long-lived socket in that environment.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] RouteSync API listening on http://localhost:${port}`);
  });
}

export default app;
// @ts-ignore
module.exports = app;
// @ts-ignore
module.exports.default = app;

