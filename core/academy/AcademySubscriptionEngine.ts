// ============================================================================
// FILE:
// /core/academy/AcademySubscriptionEngine.ts
// ============================================================================

export class AcademySubscriptionEngine{

    activate(

        userId:string,

        months:number

    ){

        return{

            userId,

            expiresAt:

            Date.now()+

            months*

            30*

            24*

            60*

            60*

            1000

        };

    }

}
