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

      console.error(
        "Dependency analyzer error:",
        errorText
      );

      return res.status(502).json({
        message: "Dependency analyzer request failed",
      });
    }

    const analysis = await response.json();

    return res.json({
      repository: analysis.repository ?? {
        name: "Local Workspace",
      },

      graph: analysis.dependency_graph ?? {
        nodes: [],
        edges: [],
      },

      dependency_analysis:
        analysis.graph_analysis ?? {
          summary: {},
          files: [],
          hotspots: [],
          most_depended_on: [],
          most_dependent_on: [],
          isolated_files: [],
          entry_points: [],
          cycles: [],
          external_dependencies: [],
          external_packages: [],
          unresolved_dependencies: [],
        },
    });
  } catch (error) {
    console.error(
      "Failed to fetch dependency analysis:",
      error
    );

    return res.status(502).json({
      message:
        "Unable to connect to dependency analyzer",
    });
  }
});

export default router;