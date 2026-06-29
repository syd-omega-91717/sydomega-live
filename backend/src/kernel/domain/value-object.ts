// ============================================================================
// FILE: /backend/src/kernel/domain/value-object.ts
// NEW FILE
// ============================================================================

export abstract class ValueObject<T>{

    protected constructor(

        protected readonly props:T

    ){}

    equals(

        other:ValueObject<T>

    ):boolean{

        return JSON.stringify(

            this.props

        )===

        JSON.stringify(

            other.props

        );

    }

}
