import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRouter from "./routes/health.routes.js";
import analysisRouter from "./routes/analysis.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    name: "Codebase Intelligence Platform API",
    status: "running",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/analysis", analysisRouter);

export default app;