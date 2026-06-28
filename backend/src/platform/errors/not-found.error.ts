// ============================================================================
// FILE: /backend/src/platform/errors/not-found.error.ts
// NEW FILE
// ============================================================================

import { ApplicationError }

from "./application-error.js";

export class NotFoundError

extends ApplicationError {

    constructor(

        resource: string

    ) {

        super(

            "NOT_FOUND",

            `${resource} not found.`,

            404

        );

    }

}
