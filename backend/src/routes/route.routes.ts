import {
  Request,
  Response,
  Router,
} from "express";

import { env } from "../config/env.js";

const router = Router();

router.get(
  "/overview",
  async (_req: Request, res: Response) => {
    try {
      const response = await fetch(
        `${env.ANALYZER_URL}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path:
              process.env.ANALYZER_TARGET_PATH,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Route analyzer error:",
          errorText
        );

        return res.status(502).json({
          message:
            "Route analyzer request failed",
        });
      }

      const analysis =
        await response.json();

      return res.json({
        repository: {
          name: "Local Workspace",
        },

        summary:
          analysis.route_summary ?? {
            total_routes: 0,
            api_routes: 0,
            page_routes: 0,
            dynamic_routes: 0,
            express_routes: 0,
            nextjs_routes: 0,
            methods: {},
          },

        routes:
          analysis.route_analysis ?? [],

        flows:
          analysis.route_flows ?? [],
      });
    } catch (error) {
      console.error(
        "Failed to fetch route analysis:",
        error
      );

      return res.status(502).json({
        message:
          "Unable to connect to dependency analyzer",
      });
    }
  }
);

export default router;