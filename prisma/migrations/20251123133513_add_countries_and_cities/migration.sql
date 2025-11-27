/*
  Warnings:

  - Added the required column `city_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occupation` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bornDate" TIMESTAMP(3),
ADD COLUMN     "city_id" TEXT NOT NULL,
ADD COLUMN     "country_id" TEXT NOT NULL,
ADD COLUMN     "desc_personalization" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "mbti" TEXT,
ADD COLUMN     "mbti_desc" TEXT,
ADD COLUMN     "occupation" TEXT NOT NULL,
ADD COLUMN     "personality" BYTEA,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT,
    "iso3" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regions_name_idx" ON "regions"("name");

-- CreateIndex
CREATE INDEX "countries_region_id_idx" ON "countries"("region_id");

-- CreateIndex
CREATE INDEX "countries_name_idx" ON "countries"("name");

-- CreateIndex
CREATE INDEX "cities_country_id_idx" ON "cities"("country_id");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "cities"("name");

-- CreateIndex
CREATE INDEX "users_country_id_idx" ON "users"("country_id");

-- CreateIndex
CREATE INDEX "users_city_id_idx" ON "users"("city_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countries" ADD CONSTRAINT "countries_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
