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
         * @param {string} category
         * @param {number} limit
         * @returns {Promise<Questioner[]>}
         */
        async findRandomByCategory(category, limit = 5) {
            return prisma.questioner.findMany({
                where: { category },
                take: limit,
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