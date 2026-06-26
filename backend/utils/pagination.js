export function paginate(page = 1, limit = 20) {

    page = Number(page);

    limit = Number(limit);

    return {

        page,

        limit,

        from: (page - 1) * limit,

        to: page * limit - 1

    };

}
