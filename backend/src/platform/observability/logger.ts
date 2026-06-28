// ============================================================================
// FILE: /backend/src/platform/observability/logger.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

export type LogLevel =

    | "trace"
    | "debug"
    | "info"
    | "warn"
    | "error"
    | "fatal";

export interface LogContext {

    traceId?: string;

    correlationId?: string;

    userId?: string;

    module?: string;

    action?: string;

    metadata?: Record<string, unknown>;

}

class Logger {

    private write(

        level: LogLevel,

        message: string,

        context?: LogContext

    ) {

        const entry = {

            timestamp: new Date().toISOString(),

            level,

            message,

            ...context

        };

        console.log(

            JSON.stringify(entry)

        );

    }

    public trace(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "trace",

            message,

            context

        );

    }

    public debug(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "debug",

            message,

            context

        );

    }

    public info(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "info",

            message,

            context

        );

    }

    public warn(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "warn",

            message,

            context

        );

    }

    public error(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "error",

            message,

            context

        );

    }

    public fatal(

        message: string,

        context?: LogContext

    ) {

        this.write(

            "fatal",

            message,

            context

        );

    }

}

export default new Logger();
