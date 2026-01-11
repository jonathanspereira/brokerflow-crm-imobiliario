/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "imoveis" ADD COLUMN     "address" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "cpf" TEXT;

-- CreateTable
CREATE TABLE "document_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_cpf_key" ON "leads"("cpf");
