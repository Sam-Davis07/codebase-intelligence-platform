import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().min(1),

  DIRECT_URL: z.string().min(1),

  ANALYZER_URL: z.string().url().default("http://localhost:8000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env)