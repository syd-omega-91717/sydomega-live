// ============================================================================
// FILE: /backend/src/database/query.ts
// NEW FILE
// ============================================================================

export interface QueryOptions {

    page?: number;

    limit?: number;

    orderBy?: string;

    ascending?: boolean;

}

export function normalizeQuery(

    options: QueryOptions = {}

) {

    const page =

        Math.max(

            1,

            options.page ?? 1

        );

    const limit =

        Math.min(

            100,

            Math.max(

                1,

                options.limit ?? 25

            )

        );

    const from =

        (page - 1) * limit;

    const to =

        from + limit - 1;

    return {

        page,

        limit,

        from,

        to,

        orderBy:

            options.orderBy ?? "created_at",

        ascending:

            options.ascending ?? false

    };

}
