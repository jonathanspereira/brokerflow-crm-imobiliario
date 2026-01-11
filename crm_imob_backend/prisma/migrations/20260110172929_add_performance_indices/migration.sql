/*
  Warnings:

  - You are about to drop the column `asaasCustomerId` on the `agencias` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `agencias` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `agencias` table. All the data in the column will be lost.
  - You are about to drop the column `trialEndsAt` on the `agencias` table. All the data in the column will be lost.
  - You are about to drop the `PlanSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faturas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "faturas" DROP CONSTRAINT "faturas_agenciaId_fkey";

-- AlterTable
ALTER TABLE "agencias" DROP COLUMN "asaasCustomerId",
DROP COLUMN "plan",
DROP COLUMN "subscriptionStatus",
DROP COLUMN "trialEndsAt";

-- DropTable
DROP TABLE "PlanSetting";

-- DropTable
DROP TABLE "faturas";

-- DropEnum
DROP TYPE "PlanType";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateIndex
CREATE INDEX "imoveis_agenciaId_idx" ON "imoveis"("agenciaId");

-- CreateIndex
CREATE INDEX "imoveis_status_idx" ON "imoveis"("status");

-- CreateIndex
CREATE INDEX "leads_agenciaId_idx" ON "leads"("agenciaId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_agenciaId_status_idx" ON "leads"("agenciaId", "status");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "users_agenciaId_idx" ON "users"("agenciaId");

-- CreateIndex
CREATE INDEX "users_equipeId_idx" ON "users"("equipeId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "vendas_agenciaId_idx" ON "vendas"("agenciaId");

-- CreateIndex
CREATE INDEX "vendas_brokerId_idx" ON "vendas"("brokerId");

-- CreateIndex
CREATE INDEX "vendas_createdAt_idx" ON "vendas"("createdAt");
