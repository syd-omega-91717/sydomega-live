// ============================================================================
// FILE: /backend/src/database/Pagination.ts
// NEW FILE
// ============================================================================

export interface PaginationQuery {

    page: number;

    limit: number;

}

export function buildRange(

    page: number,

    limit: number

) {

    const from =

        (page - 1) * limit;

    const to =

        from + limit - 1;

    return {

        from,

        to

    };

}
