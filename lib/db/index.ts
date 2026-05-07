import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | undefined;

function getDrizzle(): Db {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const d = getDrizzle();
    const value = Reflect.get(d as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(d);
    }
    return value;
  },
});
