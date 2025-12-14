-- AlterTable
ALTER TABLE "ProductionCount" 
ADD COLUMN "inicio_producao" TIMESTAMP(3),
ADD COLUMN "fim_producao" TIMESTAMP(3),
ADD COLUMN "tempo_producao_segundos" INTEGER;
