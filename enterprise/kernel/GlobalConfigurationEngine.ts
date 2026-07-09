// ============================================================================
// FILE:
// /enterprise/kernel/GlobalConfigurationEngine.ts
// ============================================================================

export class GlobalConfigurationEngine{

    update(

        key:string,

        value:unknown

    ){

        return{

            key,

            value,

            synchronized:true

        };

    }

}
