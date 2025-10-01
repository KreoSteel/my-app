export interface Pagination {
    limit: number;
    totalPages: number;
    totalItems: number;
    currentPage: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}