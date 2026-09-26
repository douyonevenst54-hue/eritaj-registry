-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('IN_PERSON', 'VIDEO');

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "verificationMethod" "VerificationMethod",
ADD COLUMN     "verificationNote" TEXT;
