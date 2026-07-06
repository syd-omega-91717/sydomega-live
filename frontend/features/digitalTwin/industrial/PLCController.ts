// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/PLCController.ts
// ============================================================================

export interface PLCVariable{

    name:string;

    address:string;

    type:string;

    value:unknown;

}

export class PLCController{

    private readonly variables=

    new Map<string,PLCVariable>();

    connect(endpoint:string){

        return{

            connected:true,

            endpoint

        };

    }

    register(variable:PLCVariable){

        this.variables.set(

            variable.name,

            variable

        );

    }

    read(name:string){

        return this.variables.get(name);

    }

    write(

        name:string,

        value:unknown

    ){

        const variable=

        this.variables.get(name);

        if(variable){

            variable.value=value;

        }

    }

}
