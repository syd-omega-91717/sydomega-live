// ============================================================================
// FILE: /backend/src/utils/dates.ts
// NEW FILE
// ============================================================================

import { ACCESS_DURATION_SECONDS } from "./constants.js";

export function now(): Date {

    return new Date();

}

export function expiresAt(): Date {

    return new Date(

        Date.now()

        + ACCESS_DURATION_SECONDS * 1000

    );

}

export function iso(date: Date = new Date()): string {

    return date.toISOString();

}
