export function requireFields(body, fields = []) {

    const missing = [];

    for (const field of fields) {

        if (
            body[field] === undefined ||
            body[field] === null ||
            body[field] === ""
        ) {
            missing.push(field);
        }

    }

    return {
        valid: missing.length === 0,
        missing
    };

}

export function isEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

export function isUUID(value) {

    return /^[0-9a-fA-F-]{36}$/.test(value);

}
