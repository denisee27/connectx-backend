export function makeRoomService({ roomRepository }) {
    return {
        async getHighlights() {
            return roomRepository.getHighlights();
        },
        async getPopular() {
            return roomRepository.getPopular();
        },
        async getRoomBySlug(slug) {
            return roomRepository.findBySlug(slug);
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