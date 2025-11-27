/**
 * @param {{ prisma: import('@prisma/client').PrismaClient }}
 */
export function makePreferenceRepository({ prisma }) {
    const safePreferenceSelect = {
        id: true,
        userId: true,
        name: true,
    };

    return {
        /**
         * @param {string} id
         */
        async findById(id) {
            return prisma.preference.findUnique({
                where: { id },
                select: safePreferenceSelect,
            });
        },

        async findAll() {
            return prisma.preference.findMany({
                select: safePreferenceSelect,
            });
        },

        /**
         * @param {import('../utils/pagination.js').PaginationOptions} options
         */
        async findMany(options) {
            const { page, limit, where, orderBy } = getPageData(options);

            const [preferences, total] = await Promise.all([
                prisma.preference.findMany({
                    skip: (page - 1) * limit,
                    take: limit,
                    where,
                    orderBy,
                    select: safePreferenceSelect,
                }),
                prisma.preference.count({ where }),
            ]);

            return {
                data: preferences,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        },

        /**
         * @param {object} preferenceData
         */
        async create(preferenceData) {
            return prisma.preference.create({
                data: preferenceData,
                select: safePreferenceSelect,
            });
        },

        /**
         * @param {string} id
         * @param {object} preferenceData
         */
        async update(id, preferenceData) {
            return prisma.preference.update({
                where: { id },
                data: preferenceData,
                select: safePreferenceSelect,
            });
        },

        /**
         * @param {string} id
         */
        async delete(id) {
            return prisma.preference.delete({
                where: { id },
                select: safePreferenceSelect,
            });
        },
    };
}