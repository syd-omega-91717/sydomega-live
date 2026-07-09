// ============================================================================
// FILE:
// /enterprise/kernel/SystemLifecycleManagerEngine.ts
// ============================================================================

export class SystemLifecycleManagerEngine{

    transition(

        componentId:string,

        state:string

    ){

        return{

            componentId,

            state,

            successful:true

        };

    }

}
