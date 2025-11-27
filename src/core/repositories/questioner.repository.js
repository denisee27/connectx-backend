/**
 * @typedef {import('@prisma/client').PrismaClient} PrismaClient
 * @typedef {import('@prisma/client').Questioner} Questioner
 * @typedef {import('../utils/pagination.js').PageData} PageData
 * @typedef {import('../utils/pagination.js').Pagination} Pagination
 */


/**
 * @param {PrismaClient} prisma
 */
export function makeQuestionerRepository({ prisma }) {
    const safeQuestionerSelect = {
        id: true,
        category: true,
        type: true,
        question: true,
    };
    return {
        /**
         * @param {string} id
         * @returns {Promise<Questioner | null>}
         */
        async findById(id) {
            return prisma.questioner.findUnique({
                where: { id },
                select: safeQuestionerSelect,
            });
        },

        /**
         * @param {Pagination} pagination
         * @returns {Promise<PageData<Questioner>>}
         */
        // async findMany({ page, limit, search, type, category }) {
        //     const where = {
        //         question: {
        //             contains: search,
        //             mode: 'insensitive',
        //         },
        //         type,
        //         category,
        //     };

        //     const [questioners, total] = await Promise.all([
        //         prisma.questioner.findMany({
        //             where,
        //             select: safeQuestionerSelect,
        //             take: limit,
        //             skip: (page - 1) * limit,
        //         }),
        //         prisma.questioner.count({ where }),
        //     ]);

        //     return getPageData(questioners, total, page, limit);
        // },

        /**
         * @param {Questioner} data
         * @returns {Promise<Questioner>}
         */
        create(data) {
            return prisma.questioner.create({
                data,
                select: safeQuestionerSelect,
            });
        },

        /**
         * @param {Questioner} data
         * @returns {Promise<Questioner>}
         */
        update(id, data) {
            return prisma.questioner.update({
                where: { id },
                data,
                select: safeQuestionerSelect,
            });
        },

        /**
         * @param {string} id
         * @returns {Promise<Questioner>}
         */
        delete(id) {
            return prisma.questioner.delete({
                where: { id },
                select: safeQuestionerSelect,
            });
        },

        /**
         * @returns {Promise<Questioner[]>}
         */
        async findAll() {
            return prisma.questioner.findMany({
                select: safeQuestionerSelect,
            });
        },
    };
}