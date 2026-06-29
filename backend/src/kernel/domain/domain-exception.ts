// ============================================================================
// FILE: /backend/src/kernel/domain/domain-exception.ts
// NEW FILE
// ============================================================================

export abstract class DomainException

extends Error{

    constructor(

        message:string,

        readonly code:string

    ){

        super(message);

    }

}
