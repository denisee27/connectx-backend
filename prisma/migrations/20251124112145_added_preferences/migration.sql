/*
  Warnings:

  - The `personality` column on the `rooms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `personality` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `city_id` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_id` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questioners" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "question" DROP NOT NULL,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "city_id" TEXT NOT NULL,
ADD COLUMN     "region_id" TEXT NOT NULL,
DROP COLUMN "personality",
ADD COLUMN     "personality" JSONB;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "personality",
ADD COLUMN     "personality" JSONB;

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preferences_user_id_idx" ON "preferences"("user_id");

-- CreateIndex
CREATE INDEX "preferences_name_idx" ON "preferences"("name");

-- CreateIndex
CREATE INDEX "rooms_region_id_idx" ON "rooms"("region_id");

-- CreateIndex
CREATE INDEX "rooms_city_id_idx" ON "rooms"("city_id");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
