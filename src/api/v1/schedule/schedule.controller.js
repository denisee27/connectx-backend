export default {
    async getUpcoming(req, res, next) {
        try {
            const scheduleService = req.scope.resolve('scheduleService');
            const upcoming = await scheduleService.getUpcomingSchedules(req.user.userId);
            res.status(200).json({ success: true, data: upcoming });
        } catch (error) {
            next(error);
        }
    },
    async getPast(req, res, next) {
        try {
            const scheduleService = req.scope.resolve('scheduleService');
            const past = await scheduleService.getPastSchedules(req.user.userId);
            res.status(200).json({ success: true, data: past });
        } catch (error) {
            next(error);
        }
    },
}