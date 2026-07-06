// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/SCADAConnector.ts
// ============================================================================

export interface SCADAServer{

    id:string;

    endpoint:string;

}

export class SCADAConnector{

    async connect(

        server:SCADAServer

    ){

        return{

            connected:true,

            server

        };

    }

    async subscribe(

        tag:string

    ){

        return{

            tag,

            subscribed:true

        };

    }

}
