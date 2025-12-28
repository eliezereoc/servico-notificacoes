import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Prisma 7: usar driver adapter para MySQL/MariaDB
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not defined");
}
const adapter = new PrismaMariaDb(databaseUrl);

export const prisma = new PrismaClient({ adapter });
