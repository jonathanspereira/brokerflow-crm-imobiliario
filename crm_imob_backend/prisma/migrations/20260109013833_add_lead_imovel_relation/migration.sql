-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "imovelId" TEXT;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
