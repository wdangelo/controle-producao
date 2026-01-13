-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "concluido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "data_conclusao" TIMESTAMP(3),
ADD COLUMN     "tempo_total_producao_segundos" INTEGER;
