import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️  TURSO_DATABASE_URL is not set. Database queries will fail at runtime.\n" +
      "   Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file.",
  );
}

export const client = createClient({
  url: dbUrl || "file:local.db",
  authToken: dbToken,
});

export const db = drizzle(client, { schema });
