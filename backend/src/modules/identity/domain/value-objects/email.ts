// ============================================================================
// FILE: /backend/src/modules/identity/domain/value-objects/email.ts
// NEW FILE
// ============================================================================

export class Email{

    constructor(

        readonly value:string

    ){

        if(!value.includes("@")){

            throw new Error(

                "Invalid email."

            );

        }

    }

}
