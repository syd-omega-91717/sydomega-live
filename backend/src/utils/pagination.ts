export function pagination(page?: any, limit?: any) {

    const current = Math.max(
        Number(page || 1),
        1
    );

    const size = Math.min(
        Math.max(Number(limit || 20), 1),
        100
    );

    return {

        page: current,

        limit: size,

        from: (current - 1) * size,

        to: current * size - 1

    };

}
