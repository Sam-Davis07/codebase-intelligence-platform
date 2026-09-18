import {
  Request,
  Response,
  Router,
} from "express";

import { env } from "../config/env.js";

const router = Router();

router.post(
  "/analyze",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { symbol } = req.body;

      if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({
          message: "Symbol is required",
        });
      }

      const analyzerPath =
        process.env.ANALYZER_TARGET_PATH;

      if (!analyzerPath) {
        console.error(
          "ANALYZER_TARGET_PATH is not configured"
        );

        return res.status(500).json({
          message:
            "Analyzer target path is not configured",
        });
      }

      const response = await fetch(
        `${env.ANALYZER_URL}/analyze/impact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: analyzerPath,
            symbol: symbol.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Impact analyzer error:",
          response.status,
          errorText
        );

        return res.status(502).json({
          message:
            "Impact analyzer request failed",
          analyzerStatus: response.status,
          analyzerResponse: errorText,
        });
      }

      const impact =
        await response.json();

      return res.json(impact);
    } catch (error) {
      console.error(
        "Failed to fetch impact analysis:",
        error
      );

      return res.status(502).json({
        message:
          "Unable to connect to impact analyzer",
      });
    }
  }
);

export default router;