import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

export default {
    async getPopular(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const { cityId } = req.query;
            const rooms = await roomService.getPopular(cityId);
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },

    async joinRoom(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const { id } = req.params;
            const { userId } = req.user;
            await roomService.joinRoom(id, userId);
            res.status(200).json({ message: "Successfully joined the room" });
        } catch (error) {
            next(error);
        }
    },

    async getHighlights(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const { cityId } = req.query;
            const rooms = await roomService.getHighlights(cityId);
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
    async getRoomBySlug(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const authHeader = req.headers.authorization;
            const { slug } = req.params;
            const room = await roomService.getRoomBySlug(slug, authHeader);
            res.status(200).json(room);
        } catch (error) {
            next(error);
        }
    },
    // Controller
    async getRooms(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const {
                page = 1,
                limit = 12,
                sort = 'datetime_asc',
                categories,
                country,
                paymentType,
                title
            } = req.query;

            const filters = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 12),
                sort,
                categories,
                country,
                title,
                paymentType
            };

            const rooms = await roomService.getRooms(filters);
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
    async getImage(req, res, next) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        try {

            const { filename } = req.params;
            const imagePath = path.resolve(__dirname, '../../../../../uploads', filename);
            res.sendFile(imagePath);
        } catch (error) {
            next(error);
        }
    },
    async createRoom(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const { userId } = req.user;
            // Validate file presence (required)
            if (!req.file) {
                return res.status(400).json({ success: false, error: "Event image is required" });
            }

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);

            // Ensure uploads directory exists (outside project root)
            const uploadsDir = path.resolve(__dirname, "../../../../../uploads");
            await fs.mkdir(uploadsDir, { recursive: true });

            // Normalize output to JPEG for consistent compression
            const outputExt = "jpg";

            // Generate UUID filename
            const filename = `${uuidv4()}.${outputExt}`;
            const outputPath = path.join(uploadsDir, filename);

            // Compress image with sharp
            await sharp(req.file.buffer)
                .rotate()
                .resize({ width: 1280, withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toFile(outputPath);

            // Prepare payload: include banner filename
            const payload = {
                ...req.body,
                banner: filename, // store only filename (type inferred by extension)
            };

            // Coerce numeric fields
            if (typeof payload.maxParticipant === "string") {
                const n = Number(payload.maxParticipant);
                if (!Number.isNaN(n)) payload.maxParticipant = n;
            }

            const room = await roomService.createRoom({ userId, ...payload });
            res.status(201).json(room);
        } catch (error) {
            next(error);
        }
    },
}
