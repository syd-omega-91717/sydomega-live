export function nowISO() {

    return new Date().toISOString();

}

export function unixTimestamp() {

    return Date.now();

}
