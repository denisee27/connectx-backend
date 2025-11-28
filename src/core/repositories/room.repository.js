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
    regionId: true,
    type: true,
    placeName: true,
    title: true,
    description: true,
    datetime: true,
    address: true,
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
        /**
         * @param {string} id
         * @returns {Promise<Room | null>}
         */
        findById(id) {
            return prisma.room.findUnique({
                where: { id },
                select: safeRoomSelect,
            });
        },

        /**
         * @returns {Promise<Room[]>}
         */
        getHighlights() {
            return prisma.room.findMany({
                take: 6,
                where: {
                    datetime: {
                        gte: new Date(),
                    },
                },
                orderBy: {
                    participants: {
                        _count: 'desc',
                    },
                },
                select: safeRoomSelect,
            });
        },

        /**
         * @param {Pagination} { page, limit, search, categoryId, type }
         * @returns {Promise<PageData<Room>>}
         */
        getPopular(userId) {
            return prisma.room.findMany({
                take: 8,
                orderBy: {
                    participants: {
                        _count: 'desc',
                    },
                },
                // where: {
                //     cityId: {
                //         // contains: userId,
                //         mode: 'insensitive',
                //     },
                // },
                select: safeRoomSelect,
            });
        },

        /**
         * @param {string} slug
         * @returns {Promise<Room | null>}
         */
        findBySlug(slug) {
            return prisma.room.findUnique({
                where: { slug },
                select: {
                    ...safeRoomSelect,
                    participants: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    mbti: true,
                                    mbtiDesc: true,
                                },
                            },
                        },
                    },
                    createdBy: {
                        select: {
                            name: true,
                            mbti: true,
                            mbtiDesc: true,
                        },
                    },
                },
            });
        },

        async findByIds(ids) {
            return prisma.room.findMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
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
