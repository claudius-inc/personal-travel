import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

// Throw early if environment variables are completely missing during instantiation
if (!dbUrl) {
  // We don't throw an error directly to avoid breaking Next.js build-time static rendering
  // The route handlers will catch db query failures if the client isn't fully configured
}

export const client = createClient({
  url: dbUrl || "libsql://missing-db-url.turso.io", // Dummy URL to prevent createClient from crashing immediately
  authToken: dbToken,
});

export const db = drizzle(client, { schema });
