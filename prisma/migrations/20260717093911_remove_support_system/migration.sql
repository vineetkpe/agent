/*
  Warnings:

  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportTicketMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SupportTicket";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SupportTicketMessage";
PRAGMA foreign_keys=on;

-- Reset support role users to user role
UPDATE "User" SET "role" = 'user' WHERE "role" = 'support';

