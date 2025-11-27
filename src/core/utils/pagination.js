
export function getPageData(data, total, page, limit) {
    if (typeof page !== 'number' || page < 1) {
        throw new Error('Invalid page number. Must be a positive integer.');
    }
    if (typeof limit !== 'number' || limit < 1) {
        throw new Error('Invalid limit value. Must be a positive integer.');
    }

    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && total > 0) {
        throw new Error('Page number exceeds total pages.');
    }

    return {
        data,
        meta: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
        },
    };
}
