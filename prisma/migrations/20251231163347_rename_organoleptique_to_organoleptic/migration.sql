-- AlterTable: Rename organoleptique to organoleptic (FR → EN key convention)
ALTER TABLE "observations" RENAME COLUMN "organoleptique" TO "organoleptic";
