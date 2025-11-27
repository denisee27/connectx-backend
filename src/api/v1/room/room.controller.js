import path from "path";
import { fileURLToPath } from "url";

export default {
    async getPopular(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const rooms = await roomService.getPopular();
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
    async getHighlights(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const rooms = await roomService.getHighlights();
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
    async getRoomBySlug(req, res, next) {
        try {
            const roomService = req.scope.resolve("roomService");
            const { slug } = req.params;
            const room = await roomService.getRoomBySlug(slug);
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
                limit = 10,
                sort = 'datetime_asc',
                categories,
                country,
                title
            } = req.query;

            const filters = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                sort,
                categories,
                country,
                title
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
}