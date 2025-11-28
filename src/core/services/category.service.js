export function makeCategoryService({ categoryRepository }) {
    return {
        async getCategories() {
            return categoryRepository.findAll();
        },
        async getCategoryBySlug(slug) {
            return categoryRepository.findBySlug(slug);
        },
    };
}