-- CreateTable
CREATE TABLE "document_history" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "imovelId" TEXT,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "proposalValue" DOUBLE PRECISION,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "document_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
