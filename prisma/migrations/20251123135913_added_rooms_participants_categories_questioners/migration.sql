-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('meetup', 'dinner', 'event');

-- CreateEnum
CREATE TYPE "QuestionerType" AS ENUM ('number', 'scale');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "type" "RoomType",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "gmaps" TEXT,
    "max_participant" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "personality" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "banner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questioners" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "QuestionerType" NOT NULL,
    "question" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questioners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_slug_key" ON "rooms"("slug");

-- CreateIndex
CREATE INDEX "rooms_slug_idx" ON "rooms"("slug");

-- CreateIndex
CREATE INDEX "rooms_category_id_idx" ON "rooms"("category_id");

-- CreateIndex
CREATE INDEX "participants_room_id_idx" ON "participants"("room_id");

-- CreateIndex
CREATE INDEX "participants_user_id_idx" ON "participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_room_id_user_id_key" ON "participants"("room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
