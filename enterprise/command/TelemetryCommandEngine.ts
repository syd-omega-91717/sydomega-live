// ============================================================================
// FILE:
// /enterprise/command/TelemetryCommandEngine.ts
// ============================================================================

export class TelemetryCommandEngine{

    receive(

        source:string,

        payload:unknown

    ){

        return{

            source,

            accepted:true

        };

    }

}
