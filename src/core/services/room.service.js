import jwt from "jsonwebtoken";
import { buildSendJoiningEventEmail } from "../../infra/mailer/templates/sendJoiningEvent/sendJoiningEvent.js";

export function makeRoomService({ roomRepository, userRepository, mailerService, env }) {
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
            const result = await roomRepository.joinRoom(roomId, userId);
            if (result) {
                const user = await userRepository.findById(userId);
                const room = await roomRepository.findById(roomId);
                if (user && room) {
                    const emailContent = buildSendJoiningEventEmail({
                        name: user.name,
                        eventTitle: room.title,
                        eventDate: new Date(room.datetime).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        eventLocation: room.placeName || room.address || "TBA",
                        eventLink: `${env.FRONTEND_URL}/event/${room.slug}`
                    });

                    await mailerService.sendEmail({
                        to: user.email,
                        ...emailContent
                    });
                }
            }

            return result;
        },
        async getRooms(filters) {
            const { page, limit, sort, categories, country, title, paymentType } = filters;

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

            if (paymentType === 'paid') {
                query.where.price = {
                    gt: 0
                };
            } else if (paymentType === 'free') {
                query.where.price = {
                    equals: 0
                };
            } else {
                delete query.where.price;
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