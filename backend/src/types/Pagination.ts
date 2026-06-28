// ============================================================================
// FILE: /backend/src/types/Pagination.ts
// NEW FILE
// ============================================================================

export interface Pagination {

    page: number;

    limit: number;

    total: number;

    pages: number;

}

export interface PaginatedResponse<T> {

    items: T[];

    pagination: Pagination;

}
