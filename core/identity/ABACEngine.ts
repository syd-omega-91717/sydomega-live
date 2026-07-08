// ============================================================================
// FILE:
// /core/identity/ABACEngine.ts
// ============================================================================

export class ABACEngine{

    evaluate(

        attributes:Record<string,unknown>

    ){

        return{

            granted:true,

            attributes

        };

    }

}
