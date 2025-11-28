# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files untuk install dependencies
# Copy package-lock.json juga untuk memastikan versi yang konsisten
COPY package.json package-lock.json ./

# Install semua dependencies (termasuk devDependencies untuk akses Prisma CLI)
RUN npm ci

# Copy folder prisma untuk generate client
COPY prisma ./prisma

# Generate Prisma Client
# Ini penting dilakukan sebelum prune agar artifact tersimpan di node_modules/@prisma/client
RUN npx prisma generate

# Hapus devDependencies untuk menghemat ukuran image akhir
# Generated prisma client akan tetap ada di node_modules
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

# Set NODE_ENV ke production untuk performa dan keamanan
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy dependencies yang sudah bersih (hanya production) dari stage builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy source code aplikasi
COPY src ./src

# Copy folder prisma (opsional, berguna jika ingin menjalankan migrasi saat startup)
COPY prisma ./prisma

# Cloud Run secara default mengirim trafik ke port 8080
ENV PORT=8080

# Expose port (dokumentasi, tidak wajib untuk Cloud Run tapi best practice)
EXPOSE 8080

# Jalankan aplikasi
# Pastikan script "start" di package.json adalah: "node src/server.js"
CMD ["npm", "start"]
