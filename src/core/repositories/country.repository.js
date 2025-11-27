
/**
 * @typedef {import('@prisma/client').PrismaClient} PrismaClient
 * @typedef {import('@prisma/client').Country} Country
 * @typedef {import('../utils/pagination.js').PageData} PageData
 * @typedef {import('../utils/pagination.js').Pagination} Pagination
 */

export const safeCountrySelect = {
    id: true,
    name: true,
    regionId: true,
};

/**
 * @param {PrismaClient} prisma
 */
export function makeCountryRepository({ prisma }) {
    return {
        /**
         * @param {string} id
         * @returns {Promise<Country | null>}
         */
        findById(id) {
            return prisma.country.findUnique({
                where: { id },
                select: safeCountrySelect,
            });
        },

        /**
         * @returns {Promise<Country[]>}
         */
        async findAll() {
            return prisma.country.findMany({
                select: safeCountrySelect,
                orderBy: {
                    name: 'asc',
                },
            });
        },

        /**
         * @returns {Promise<PageData<Country>>}
         */
        async findMany({ page, limit, search, regionId }) {
            const where = {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
                regionId,
            };

            const [countries, total] = await Promise.all([
                prisma.country.findMany({
                    where,
                    select: safeCountrySelect,
                    take: limit,
                    skip: (page - 1) * limit,
                }),
                prisma.country.count({ where }),
            ]);

            return getPageData(countries, total, page, limit);
        },

        /**
         * @returns {Promise<Country>}
         */
        create(data) {
            return prisma.country.create({
                data,
                select: safeCountrySelect,
            });
        },

        /**
         * @returns {Promise<Country>}
         */
        update(id, data) {
            return prisma.country.update({
                where: { id },
                data,
                select: safeCountrySelect,
            });
        },

        /**
         * @returns {Promise<Country>}
         */
        delete(id) {
            return prisma.country.delete({
                where: { id },
                select: safeCountrySelect,
            });
        },
    };
}