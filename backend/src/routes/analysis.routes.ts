import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/overview", async (_req, res) => {
  try {
    const response = await fetch(`${env.ANALYZER_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: process.env.ANALYZER_TARGET_PATH,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Analyzer error:", errorText);

      return res.status(502).json({
        message: "Analyzer request failed",
      });
    }

    const analysis = await response.json();

    const metrics = analysis.repository_metrics ?? {};

    const codeSmells =
      metrics.code_smells ??
      metrics.smells ??
      analysis.code_smells?.length ??
      analysis.smells?.length ??
      0;

    return res.json({
      repository: {
        name: "Local Workspace",
      },

      metrics: {
        files:
          metrics.total_files ??
          metrics.files ??
          0,

        functions:
          metrics.total_functions ??
          metrics.functions ??  
          0,

        qualityScore:
        analysis.quality_score?.overall_score ??
        metrics.quality_score?.overall_score ??
        metrics.quality_score ??
        0,

        codeSmells,
      },

      analysis,
    });
  } catch (error) {
    console.error("Failed to fetch analyzer data:", error);

    return res.status(502).json({
      message: "Unable to connect to analyzer",
    });
  }
});

export default router;