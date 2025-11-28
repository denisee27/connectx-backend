export default {
    async getProfile(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");
            const profile = await profileService.findProfileById(req.user.userId);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const profileService = req.scope.resolve("profileService");
            const profile = await profileService.updateProfile(req.user.userId, req.body);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

}