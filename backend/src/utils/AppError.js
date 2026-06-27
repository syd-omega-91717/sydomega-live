// ============================================================================
// FILE: /backend/src/utils/AppError.js
// NEW FILE
// ============================================================================

export default class AppError extends Error {

    constructor(

        message,

        status = 500,

        code = "APPLICATION_ERROR"

    ) {

        super(message);

        this.status = status;

        this.code = code;

        Error.captureStackTrace(this, this.constructor);

    }

}
