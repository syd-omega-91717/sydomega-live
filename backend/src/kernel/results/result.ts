// ============================================================================
// FILE: /backend/src/kernel/results/result.ts
// NEW FILE
// ============================================================================

export class Result<T>{

    private constructor(

        readonly success:boolean,

        readonly value?:T,

        readonly error?:Error

    ){}

    static ok<T>(

        value:T

    ){

        return new Result<T>(

            true,

            value

        );

    }

    static fail<T>(

        error:Error

    ){

        return new Result<T>(

            false,

            undefined,

            error

        );

    }

}
