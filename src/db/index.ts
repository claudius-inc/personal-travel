import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file.",
  );
}

export const client = createClient({
  url: dbUrl,
  authToken: dbToken,
});

export const db = drizzle(client, { schema });
