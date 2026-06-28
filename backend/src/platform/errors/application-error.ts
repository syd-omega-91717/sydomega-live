// ============================================================================
// FILE: /backend/src/platform/errors/application-error.ts
// NEW FILE
// ============================================================================

export class ApplicationError extends Error {

    constructor(

        public readonly code: string,

        message: string,

        public readonly status = 400

    ) {

        super(message);

    }

}
