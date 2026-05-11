import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // In Prisma 7, the CLI uses this URL for migrations.
    // Use the DIRECT_URL (unpooled) here to avoid connection issues.
    url: process.env["DIRECT_URL"],
  },
});
