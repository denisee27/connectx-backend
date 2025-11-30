import jwt from "jsonwebtoken";

export function makeRoomService({ roomRepository, env }) {
    return {
        async getHighlights(cityId) {
            return roomRepository.getHighlights(cityId);
        },
        async getPopular(cityId) {
            return roomRepository.getPopular(cityId);
        },
        async getRoomBySlug(slug, authHeader) {
            let userId = null;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                try {
                    const token = authHeader.substring(7);
                    const decoded = jwt.verify(token, env.JWT_SECRET);
                    if (decoded && decoded.userId) {
                        userId = decoded.userId;
                    }
                } catch (err) {
                    return null;
                }
            }
            return roomRepository.findBySlug(slug, userId);
        },
        async joinRoom(roomId, userId) {
            return roomRepository.joinRoom(roomId, userId);
        },
        async getRooms(filters) {
            const { page, limit, sort, categories, country, title } = filters;

            const query = {
                where: {},
                orderBy: {},
                skip: (page - 1) * limit,
                take: limit,
            };

            if (title) {
                query.where.title = {
                    contains: title,
                    mode: 'insensitive',
                };
            }

            if (categories) {
                query.where.categoryId = {
                    contains: categories,
                    mode: 'insensitive',
                };
            }

            if (country) {
                query.where.city = {
                    countryId: country,
                };
            }

            if (sort === 'datetime_asc') {
                query.orderBy = {
                    datetime: 'asc',
                };
            } else if (sort === 'datetime_desc') {
                query.orderBy = {
                    datetime: 'desc',
                };
            }

            return roomRepository.findMany(query);
        },
        async createRoom({ userId, ...roomData }) {
            return roomRepository.create({ ...roomData, userId });
        },
    };


}