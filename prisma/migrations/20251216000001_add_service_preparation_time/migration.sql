-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "data_inicio_preparo" TIMESTAMP(3),
ADD COLUMN     "data_fim_preparo" TIMESTAMP(3),
ADD COLUMN     "tempo_preparo_segundos" INTEGER;
