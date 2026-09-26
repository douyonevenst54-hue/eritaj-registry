-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ARTIST', 'COLLECTOR', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ArtistStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Medium" AS ENUM ('PAINTING', 'SCULPTURE', 'METALWORK', 'SEQUIN_FLAG', 'MIXED_MEDIA', 'TEXTILE', 'CERAMIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REGISTERED', 'DISPUTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('FRONT', 'BACK', 'SIGNATURE', 'DETAIL', 'ARTIST_WITH_WORK');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREATED', 'REGISTERED', 'SOLD', 'GIFTED', 'INHERITED', 'LOANED', 'EXHIBITED', 'RETURNED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'CORRECTION');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'UPHELD', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLLECTOR',
    "locale" TEXT NOT NULL DEFAULT 'ht',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "hometown" TEXT,
    "bioHt" TEXT,
    "bioFr" TEXT,
    "bioEn" TEXT,
    "photoUrl" TEXT,
    "status" "ArtistStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "registryNumber" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleHt" TEXT,
    "yearCreated" INTEGER,
    "medium" "Medium" NOT NULL,
    "widthCm" DECIMAL(7,1),
    "heightCm" DECIMAL(7,1),
    "depthCm" DECIMAL(7,1),
    "description" TEXT,
    "status" "ArtworkStatus" NOT NULL DEFAULT 'DRAFT',
    "currentOwnerId" TEXT,
    "ownerIsPublic" BOOLEAN NOT NULL DEFAULT false,
    "contentHash" TEXT,
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkImage" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "kind" "ImageKind" NOT NULL,
    "url" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistDeclaration" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "statementLocale" TEXT NOT NULL,
    "statementText" TEXT NOT NULL,
    "signedName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declarationHash" TEXT NOT NULL,

    CONSTRAINT "ArtistDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvenanceEvent" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "publicNote" TEXT,
    "privateNote" TEXT,
    "recordedById" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "prevHash" TEXT NOT NULL,
    "rowHash" TEXT NOT NULL,
    "anchorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainAnchor" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "txHash" TEXT,
    "eventCount" INTEGER NOT NULL,
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainAnchor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_userId_key" ON "Artist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Artwork_registryNumber_key" ON "Artwork"("registryNumber");

-- CreateIndex
CREATE INDEX "Artwork_artistId_idx" ON "Artwork"("artistId");

-- CreateIndex
CREATE INDEX "Artwork_status_idx" ON "Artwork"("status");

-- CreateIndex
CREATE INDEX "ArtworkImage_artworkId_idx" ON "ArtworkImage"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistDeclaration_artworkId_key" ON "ArtistDeclaration"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "ProvenanceEvent_rowHash_key" ON "ProvenanceEvent"("rowHash");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_anchorId_idx" ON "ProvenanceEvent"("anchorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProvenanceEvent_artworkId_seq_key" ON "ProvenanceEvent"("artworkId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "ChainAnchor_merkleRoot_key" ON "ChainAnchor"("merkleRoot");

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistDeclaration" ADD CONSTRAINT "ArtistDeclaration_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_anchorId_fkey" FOREIGN KEY ("anchorId") REFERENCES "ChainAnchor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
