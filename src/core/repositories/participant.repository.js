import { getPageData } from '../utils/pagination.js';

/**
 * @typedef {import('@prisma/client').PrismaClient} PrismaClient
 * @typedef {import('@prisma/client').Participant} Participant
 * @typedef {import('../utils/pagination.js').PageData} PageData
 * @typedef {import('../utils/pagination.js').Pagination} Pagination
 */

export const safeParticipantSelect = {
    id: true,
    roomId: true,
    userId: true,
};

/**
 * @param {PrismaClient} prisma
 */
export function makeParticipantRepository(prisma) {
    return {
        /**
         * @param {string} id
         * @returns {Promise<Participant | null>}
         */
        findById(id) {
            return prisma.participant.findUnique({
                where: { id },
                select: safeParticipantSelect,
            });
        },

        /**
         * @param {Pagination} { page, limit, roomId, userId }
         * @returns {Promise<PageData<Participant>>}
         */
        async findMany({ page, limit, roomId, userId }) {
            const where = { roomId, userId };

            const [participants, total] = await Promise.all([
                prisma.participant.findMany({
                    where,
                    select: safeParticipantSelect,
                    take: limit,
                    skip: (page - 1) * limit,
                }),
                prisma.participant.count({ where }),
            ]);

            return getPageData(participants, total, page, limit);
        },

        /**
         * @param {Participant} data
         * @returns {Promise<Participant>}
         */
        create(data) {
            return prisma.participant.create({
                data,
                select: safeParticipantSelect,
            });
        },

        /**
         * @param {Participant} data
         * @returns {Promise<Participant>}
         */
        update(id, data) {
            return prisma.participant.update({
                where: { id },
                data,
                select: safeParticipantSelect,
            });
        },

        /**
         * @param {Participant} data
         * @returns {Promise<Participant>}
         */
        delete(id) {
            return prisma.participant.delete({
                where: { id },
                select: safeParticipantSelect,
            });
        },
    };
}