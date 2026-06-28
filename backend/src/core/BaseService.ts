// ============================================================================
// FILE: /backend/src/core/BaseService.ts
// NEW FILE
// ============================================================================

import { Result } from "./Result.js";

export abstract class BaseService {

    /**
     * Wrap a successful business operation.
     */
    protected ok<T>(data?: T): Result<T> {

        return Result.ok(data);

    }

    /**
     * Wrap a failed business operation.
     */
    protected fail<T = never>(
        message: string,
        code = "SERVICE_ERROR"
    ): Result<T> {

        return Result.fail<T>(
            message,
            code
        );

    }

    /**
     * Convert repository results into service results.
     */
    protected fromResult<T>(
        result: Result<T>
    ): Result<T> {

        return result;

    }

    /**
     * Execute business logic safely.
     */
    protected async execute<T>(
        operation: () => Promise<Result<T>>
    ): Promise<Result<T>> {

        try {

            return await operation();

        }

        catch (error) {

            if (error instanceof Error) {

                return this.fail<T>(
                    error.message,
                    "UNEXPECTED_EXCEPTION"
                );

            }

            return this.fail<T>(
                "Unknown service exception.",
                "UNKNOWN_EXCEPTION"
            );

        }

    }

    /**
     * Validate a required value.
     */
    protected require(
        value: unknown,
        message: string
    ): Result<void> {

        if (

            value === null ||

            value === undefined ||

            value === ""

        ) {

            return this.fail<void>(
                message,
                "VALIDATION_ERROR"
            );

        }

        return this.ok();

    }

    /**
     * Validate an entity exists.
     */
    protected ensureFound<T>(
        result: Result<T>,
        entity = "Resource"
    ): Result<T> {

        if (result.isFailure) {

            return this.fail<T>(
                `${entity} not found.`,
                "NOT_FOUND"
            );

        }

        return result;

    }

    /**
     * Prevent execution when Result failed.
     */
    protected guard<T>(
        result: Result<T>
    ): T {

        if (result.isFailure) {

            throw new Error(

                result.error

            );

        }

        return result.unwrap();

    }

    /**
     * Business audit hook.
     * Can later publish to EventBus automatically.
     */
    protected async audit(

        _action: string,

        _payload?: unknown

    ): Promise<void> {

        // RC3
        // EventBus integration arrives in Batch 001.

    }

}
