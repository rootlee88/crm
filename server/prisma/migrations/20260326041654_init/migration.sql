/*
  Warnings:

  - You are about to drop the column `contract_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `lead_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `opportunity_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `task_id` on the `activities` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" INTEGER,
    "content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_activities" ("action", "content", "created_at", "id", "target_id", "target_type", "type", "user_id") SELECT "action", "content", "created_at", "id", "target_id", "target_type", "type", "user_id" FROM "activities";
DROP TABLE "activities";
ALTER TABLE "new_activities" RENAME TO "activities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
