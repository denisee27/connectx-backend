export function makeScheduleService({ roomRepository, prisma, logger }) {
    return {
        async getUpcomingSchedules(userId) {
            const result = await roomRepository.findUpcoming(userId);
            return result;
        },
        async getPastSchedules(userId) {
            const result = await roomRepository.findPast(userId);
            return result;
        },
    };
}