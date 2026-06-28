// ============================================================================
// FILE: /backend/src/core/Result.ts
// NEW FILE
// ============================================================================

/**
 * Ω SYD OMEGA 91717
 * Core Result Pattern
 *
 * Standardizes success/failure responses throughout the application.
 */

export class Result<T = void> {

    public readonly success: boolean;

    public readonly data?: T;

    public readonly error?: string;

    public readonly code?: string;

    private constructor(
        success: boolean,
        data?: T,
        error?: string,
        code?: string
    ) {

        this.success = success;
        this.data = data;
        this.error = error;
        this.code = code;

        Object.freeze(this);

    }

    public static ok<T>(data?: T): Result<T> {

        return new Result<T>(

            true,

            data

        );

    }

    public static fail<T = never>(
        error: string,
        code = "APPLICATION_ERROR"
    ): Result<T> {

        return new Result<T>(

            false,

            undefined,

            error,

            code

        );

    }

    public get isSuccess(): boolean {

        return this.success;

    }

    public get isFailure(): boolean {

        return !this.success;

    }

    public unwrap(): T {

        if (!this.success) {

            throw new Error(

                this.error ?? "Attempted to unwrap a failed Result."

            );

        }

        return this.data as T;

    }

    public match<U>(handlers: {

        ok: (value: T | undefined) => U;

        fail: (error: string, code?: string) => U;

    }): U {

        if (this.success) {

            return handlers.ok(this.data);

        }

        return handlers.fail(

            this.error ?? "Unknown Error",

            this.code

        );

    }

    public map<U>(
        mapper: (value: T) => U
    ): Result<U> {

        if (!this.success) {

            return Result.fail<U>(

                this.error ?? "Unknown Error",

                this.code

            );

        }

        return Result.ok(

            mapper(this.data as T)

        );

    }

    public async mapAsync<U>(
        mapper: (value: T) => Promise<U>
    ): Promise<Result<U>> {

        if (!this.success) {

            return Result.fail<U>(

                this.error ?? "Unknown Error",

                this.code

            );

        }

        return Result.ok(

            await mapper(

                this.data as T

            )

        );

    }

    public toJSON() {

        return {

            success: this.success,

            data: this.data,

            error: this.error,

            code: this.code

        };

    }

}
