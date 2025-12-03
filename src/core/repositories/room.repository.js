import { getPageData } from "../utils/pagination.js";
/**
 * @typedef {import('@prisma/client').PrismaClient} PrismaClient
 * @typedef {import('@prisma/client').Room} Room
 * @typedef {import('../utils/pagination.js').PageData} PageData
 * @typedef {import('../utils/pagination.js').Pagination} Pagination
 */


export const safeRoomSelect = {
    id: true,
    slug: true,
    categoryId: true,
    cityId: true,
    city: true,
    category: true,
    type: true,
    placeName: true,
    title: true,
    description: true,
    price: true,
    datetime: true,
    address: true,
    reservation: true,
    gmaps: true,
    maxParticipant: true,
    banner: true,
    createdById: true,
};

/**
 * @param {PrismaClient} prisma
 */
export function makeRoomRepository({ prisma }) {
    return {

        async isPayment(userId) {
            return prisma.payment.findFirst({
                where: { userId: userId, status: 'SETTLED' },
            });
        },

        /**
         * @param {string} roomId
         * @param {string} userId
         * @returns {Promise<void>}
         */
        async joinRoom(roomId, userId) {
            let exists
            exists = await prisma.participant.findUnique({
                where: {
                    roomId_userId: {
                        roomId,
                        userId
                    }
                }
            });

            if (!exists) {
                exists = await prisma.participant.create({
                    data: {
                        roomId,
                        userId,
                    },
                });
            }
            return exists;
        },
        /**
         * @returns {Promise<Room[]>}
         */
        async getHighlights(cityId) {
            const whereClause = {
                datetime: {
                    gte: new Date(),
                },
            };

            if (cityId && cityId !== 'undefined' && cityId !== 'null') {
                whereClause.cityId = cityId;
            }

            try {
                const allIds = await prisma.room.findMany({
                    where: whereClause,
                    select: { id: true }
                });

                if (allIds.length === 0) return [];

                const shuffled = allIds.sort(() => 0.5 - Math.random());
                const selectedIds = shuffled.slice(0, 6).map(r => r.id);

                return prisma.room.findMany({
                    where: { id: { in: selectedIds } },
                    select: safeRoomSelect
                });

            } catch (error) {
                return prisma.room.findMany({
                    take: 6,
                    where: whereClause,
                    select: safeRoomSelect,
                });
            }
        },

        /**
         * @param {Pagination} { page, limit, search, categoryId, type }
         * @returns {Promise<PageData<Room>>}
         */
        /**
         * @param {string} cityId
         * @returns {Promise<{ meetup: Room[], dinner: Room[], event: Room[] }>}
         */
        async getPopular(cityId) {
            console.log(cityId)
            const whereBase = (cityId && cityId !== 'undefined' && cityId !== 'null') ? { cityId } : {};
            const commonOptions = {
                take: 4,
                orderBy: {
                    participants: {
                        _count: 'desc',
                    },
                },
                select: {
                    ...safeRoomSelect,
                    city: {
                        select: {
                            name: true,
                        },
                    },
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            };

            const [meetup, dinner, event] = await Promise.all([
                prisma.room.findMany({
                    where: { ...whereBase, type: 'meetup' },
                    ...commonOptions,
                }),
                prisma.room.findMany({
                    where: { ...whereBase, type: 'dinner' },
                    ...commonOptions,
                }),
                prisma.room.findMany({
                    where: { ...whereBase, type: 'event' },
                    ...commonOptions,
                }),
            ]);

            return {
                meetup,
                dinner,
                event,
            };
        },

        /**
         * @param {string} slug
         * @param {string|null} userId
         * @returns {Promise<Room | null>}
         */
        async findBySlug(slug, userId) {
            const room = await prisma.room.findUnique({
                where: { slug },
                select: {
                    ...safeRoomSelect,
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                    participants: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    mbti: true,
                                    mbtiDesc: true,
                                    profilePictureUrl: true,
                                }
                            },
                            userId: true // Make sure to select userId to check against
                        }
                    },
                    createdBy: {
                        select: {
                            name: true,
                            mbti: true,
                            mbtiDesc: true,
                            profilePictureUrl: true,
                        },
                    },
                },
            });

            if (!room) return null;

            let isJoining = false;
            let isCreator = false;
            let isPayment = false;
            if (userId && room.participants) {
                const paymentCheck = await prisma.payment.findFirst({
                    where: {
                        userId,
                        roomId: room.id,
                        status: { in: ["PAID", "SETTLED"] }
                    }
                });
                isPayment = !!paymentCheck;
                isCreator = room.createdById === userId;
                isJoining = room.participants.some(p => p.userId === userId);
            }

            return {
                ...room,
                isJoining,
                isCreator,
                isPayment,
            };
        },


        async findById(id) {
            console.log(id)
            return prisma.room.findUnique({
                where: { id },
                select: safeRoomSelect,
            });

        },

        /**
         * @param {Pagination} { page, limit, search, categoryId, type }
         * @returns {Promise<PageData<Room>>}
         */
        async findMany(query) {
            const { where, orderBy, skip, take } = query;

            const [rooms, total] = await Promise.all([
                prisma.room.findMany({
                    where,
                    orderBy,
                    skip,
                    take,
                    select: {
                        ...safeRoomSelect,
                        _count: {
                            select: {
                                participants: true,
                            },
                        },
                    },
                }),
                prisma.room.count({ where }),
            ]);

            return getPageData(rooms, total, query.skip / query.take + 1, query.take);
        },

        /**
         * @param {string} id
         * @returns {Promise<Room>}
         */
        async create(data) {
            const payload = data || {};

            const toSlug = (str) =>
                (str || "")
                    .toString()
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-");

            const normalizeType = (t) => {
                const v = (t || "").toLowerCase();
                return ["meetup", "dinner", "event"].includes(v) ? v : null;
            };

            const ensureUniqueSlug = async (base) => {
                let candidate = base || "event";
                let idx = 2;
                // Try base, then append -2, -3, ... until unique
                while (true) {
                    const exists = await prisma.room.findUnique({ where: { slug: candidate } });
                    if (!exists) return candidate;
                    candidate = `${base}-${idx++}`;
                    if (idx > 100) {
                        // Safety break to avoid infinite loops
                        return `${base}-${Date.now()}`;
                    }
                }
            };

            // Derive slug from title if absent
            const baseSlug = payload.slug || toSlug(payload.title);
            const slug = await ensureUniqueSlug(baseSlug);

            // Derive regionId from City -> Country relation if not provided
            let regionId = payload.regionId || null;
            const cityId = payload.cityId || null;
            if (!regionId && cityId) {
                const city = await prisma.city.findUnique({
                    where: { id: cityId },
                    select: {
                        country: {
                            select: { regionId: true },
                        },
                    },
                });
                regionId = city?.country?.regionId || null;
            }

            const type = normalizeType(payload.type);
            let maxParticipant = Number(payload.maxParticipant);
            if (!Number.isFinite(maxParticipant)) {
                maxParticipant = type === "meetup" ? 10 : type === "dinner" ? 4 : 0; // 0 = unlimited
            }

            const createData = {
                slug,
                categoryId: payload.categoryId,
                regionId,
                cityId,
                type,
                reservation: payload.reservationInformation ?? null,
                price: Number(payload.price) || 0,
                title: payload.title,
                placeName: payload.placeName ?? payload.place_name ?? null,
                description: payload.description ?? null,
                datetime: payload.datetime ? new Date(payload.datetime) : new Date(),
                banner: payload.banner ?? null,
                address: payload.address ?? null,
                gmaps: payload.gmaps ?? null,
                maxParticipant,
                createdById: payload.userId ?? payload.createdById ?? null,
            };

            return prisma.room.create({
                data: createData,
                select: safeRoomSelect,
            });
        },

        /**
         * @param {string} id
         * @returns {Promise<Room>}
         */
        update(id, data) {
            return prisma.room.update({
                where: { id },
                data,
                select: safeRoomSelect,
            });
        },

        /**
         * @param {string} id
         * @returns {Promise<Room>}
         */
        delete(id) {
            return prisma.room.delete({
                where: { id },
                select: safeRoomSelect,
            });
        },

        async findByIds(ids) {
            return prisma.room.findMany({
                where: { id: { in: ids } },
                select: safeRoomSelect
            });
        },

        async findRandomByCountry(countryId, limit = 3) {
            const where = {
                city: {
                    countryId: countryId
                },
                datetime: { gte: new Date() }
            };

            const count = await prisma.room.count({ where });
            if (count === 0) return [];

            // If count is small, fetch all and shuffle
            if (count <= limit * 5) {
                const rooms = await prisma.room.findMany({
                    where,
                    select: safeRoomSelect
                });
                return rooms.sort(() => 0.5 - Math.random()).slice(0, limit);
            }

            // If large, pick random skip
            const skip = Math.floor(Math.random() * (count - limit));
            return prisma.room.findMany({
                where,
                skip: Math.max(0, skip),
                take: limit,
                select: safeRoomSelect
            });
        },

        async findRandom(limit = 3) {
            const where = { datetime: { gte: new Date() } };
            const count = await prisma.room.count({ where });
            if (count === 0) return [];

            if (count <= limit * 5) {
                const rooms = await prisma.room.findMany({
                    where,
                    select: safeRoomSelect
                });
                return rooms.sort(() => 0.5 - Math.random()).slice(0, limit);
            }

            const skip = Math.floor(Math.random() * (count - limit));
            return prisma.room.findMany({
                where,
                skip: Math.max(0, skip),
                take: limit,
                select: safeRoomSelect
            });
        },

        async findUpcoming(userId) {
            const rooms = await prisma.room.findMany({
                where: {
                    OR: [
                        {
                            participants: {
                                some: { userId },
                            },
                        },
                        { createdById: userId },
                    ],
                    datetime: {
                        gte: new Date(),
                    },
                },
                select: safeRoomSelect,
            });
            return rooms.map((room) => ({
                ...room,
                creator: room.createdById === userId,
            }));
        },

        async findPast(userId) {
            const rooms = await prisma.room.findMany({
                where: {
                    OR: [
                        {
                            participants: {
                                some: { userId },
                            },
                        },
                        { createdById: userId },
                    ],
                    datetime: {
                        lt: new Date(),
                    },
                },
                select: safeRoomSelect,
            });
            return rooms.map((room) => ({
                ...room,
                creator: room.createdById === userId,
            }));
        },

    };
}
