/*
  Warnings:

  - You are about to drop the column `marca_material` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_metal` on the `Service` table. All the data in the column will be lost.
  - Added the required column `marca_material` to the `Piece` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_metal` to the `Piece` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Piece" ADD COLUMN     "marca_material" TEXT NOT NULL,
ADD COLUMN     "tipo_metal" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "marca_material",
DROP COLUMN "tipo_metal";
