-- AlterTable
ALTER TABLE "Artwork" ALTER COLUMN "registryNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RegistryCounter" (
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RegistryCounter_pkey" PRIMARY KEY ("year")
);
