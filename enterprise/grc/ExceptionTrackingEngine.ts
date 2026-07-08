// ============================================================================
// FILE:
// /enterprise/grc/ExceptionTrackingEngine.ts
// ============================================================================

export class ExceptionTrackingEngine{

    register(

        exceptionId:string

    ){

        return{

            exceptionId,

            tracked:true

        };

    }

}
