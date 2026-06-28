// ============================================================================
// FILE: /backend/src/platform/errors/unauthorized.error.ts
// NEW FILE
// ============================================================================

import { ApplicationError }

from "./application-error.js";

export class UnauthorizedError

extends ApplicationError {

    constructor(

        message =

            "Unauthorized."

    ) {

        super(

            "UNAUTHORIZED",

            message,

            401

        );

    }

}
