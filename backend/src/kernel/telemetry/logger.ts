// ============================================================================
// FILE: /backend/src/kernel/telemetry/logger.ts
// NEW FILE
// ============================================================================

export interface Logger {

    debug(

        message: string,

        context?: Record<string, unknown>

    ): void;

    info(

        message: string,

        context?: Record<string, unknown>

    ): void;

    warn(

        message: string,

        context?: Record<string, unknown>

    ): void;

    error(

        message: string,

        error?: Error,

        context?: Record<string, unknown>

    ): void;

}
