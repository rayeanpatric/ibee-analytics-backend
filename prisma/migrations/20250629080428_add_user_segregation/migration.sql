-- AlterTable
ALTER TABLE "logs" ADD COLUMN "userId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "email" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_records" ("age", "createdAt", "email", "id", "name", "updatedAt") SELECT "age", "createdAt", "email", "id", "name", "updatedAt" FROM "records";
DROP TABLE "records";
ALTER TABLE "new_records" RENAME TO "records";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
