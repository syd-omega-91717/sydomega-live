// ============================================================================
// FILE: /backend/src/utils/strings.ts
// NEW FILE
// ============================================================================

export function capitalize(value: string): string {

    if (!value) return value;

    return value.charAt(0).toUpperCase()

        + value.slice(1);

}

export function slugify(value: string): string {

    return value

        .trim()

        .toLowerCase()

        .replace(/\s+/g, "-")

        .replace(/[^\w-]/g, "");

}

export function normalizeEmail(email: string): string {

    return email

        .trim()

        .toLowerCase();

}
