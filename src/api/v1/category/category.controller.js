export default {
    async getCategories(req, res, next) {
        try {
            const categoryService = req.scope.resolve("categoryService");
            const categories = await categoryService.getCategories();
            res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    },
    async getCategoryBySlug(req, res, next) {
        try {
            const categoryService = req.scope.resolve("categoryService");
            const category = await categoryService.getCategoryBySlug(req.params.slug);
            res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    },
}